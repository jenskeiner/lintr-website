#!/usr/bin/env python
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "cleo>=1.0.0a5",
#   "httpx>=0.23",
#   "PyYAML>=6.0.2",
# ]
# ///
from __future__ import annotations

import abc
import itertools
import os
import shutil
import stat
import subprocess
import tempfile
import json

from contextlib import contextmanager
from pathlib import Path
from typing import TYPE_CHECKING
from typing import Any

import httpx
import yaml

from cleo.application import Application
from cleo.commands.command import Command
from cleo.helpers import option


if TYPE_CHECKING:
    from collections.abc import Iterable
    from collections.abc import Iterator
    from typing import ClassVar

    from cleo.io.inputs.option import Option


BASE_URL = "https://github.com/"
API_BASE_URL = "https://api.github.com/repos/"


class Project(abc.ABC):
    @property
    @abc.abstractmethod
    def repo(self) -> str:
        """Return the repo name in the format <user>/<repo>"""

    @property
    @abc.abstractmethod
    def name(self) -> str:
        pass

    @property
    @abc.abstractmethod
    def description(self) -> str:
        return self.name

    @property
    def display_name(self) -> str:
        return self.name

    @property
    def display_name_short(self) -> str:
        return self.name

    @property
    def path(self) -> str:
        return self.name

    @property
    def repo_url_without_extension(self) -> str:
        return f"{BASE_URL}{self.repo}"

    @property
    def repo_url(self) -> str:
        return f"{self.repo_url_without_extension}.git"

    @property
    def branches_url(self) -> str:
        return f"{API_BASE_URL}{self.repo}/branches"

    @property
    def valid_branches(self) -> Iterable[str]:
        return "develop"

    @property
    def development_branch(self) -> str:
        return next(iter(self.valid_branches))

    @property
    def versions(self) -> list[str]:
        return []


class LintrProject(Project):
    @property
    def repo(self) -> str:
        return "jenskeiner/lintr"

    @property
    def name(self) -> str:
        return "lintr"

    @property
    def description(self) -> str:
        return "A powerful and flexible GitHub repository settings linter."

    @property
    def display_name(self) -> str:
        return "Lintr"

    @property
    def display_name_short(self) -> str:
        return "Lintr"

    @property
    def valid_branches(self) -> Iterable[str]:
        return ["develop"]

    @property
    def versions(self) -> list[str]:
        return []


_projects = (LintrProject(),)


def _del_ro(action: Any, name: str, exc: Any) -> None:
    os.chmod(name, stat.S_IWRITE)
    os.remove(name)


@contextmanager
def temporary_directory(*args: Any, **kwargs: Any) -> Iterator[str]:
    name = tempfile.mkdtemp(*args, **kwargs)

    yield name

    shutil.rmtree(name, onerror=_del_ro)


def _sanitize_branch_name(name: str) -> str:
    return name.replace("/", "-")


def get_branches(project: Project) -> dict[str, str]:
    return {
        branch["name"]: _sanitize_branch_name(branch["name"])
        for branch in httpx.get(project.branches_url, follow_redirects=True).json()
        if branch["name"] in project.valid_branches
    }

def get_configuration_template(file: Path = Path(__file__).parent.parent / "hugo.yaml.in") -> dict[str, Any]:
    with open(file) as f:
        return yaml.full_load(f)

def get_configuration(file: Path = Path(__file__).parent.parent / "hugo.yaml") -> dict[str, Any]:
    with open(file) as f:
        return yaml.full_load(f)


class ConfigureCommand(Command):
    DESTINATION: Path = Path(__file__).parent.parent / "content"
    name = "configure"
    description = "Generate website hugo.yaml file."
    options: ClassVar[list[Option]] = list(
        itertools.chain.from_iterable(
            [
                [
                    option(
                        f"local-{p.name}",
                        None,
                        f"Build from local {p.display_name} source.",
                        flag=False,
                    ),
                    option(
                        f"editable-{p.name}",
                        None,
                        f"Symlink local {p.display_name} source rather than copying.",
                    ),
                ]
                for p in _projects
            ]
        )
    )

    def render(self, file: Path | None = None) -> None:
        if file is None:
            file = Path(__file__).parent.parent / "hugo.yaml"

        content = get_configuration_template()
        config = content
        params = config.get("params", {})

        mounts = []

        for p in _projects:
            project_params = {
                "name": p.display_name,
                "description": p.description,
                "name_short": p.display_name_short,
                "repo_url": p.repo_url_without_extension,
            }
            if self.option(f"local-{p.name}"):
                version: str = "local"
                project_params["documentation"] = {
                    "defaultVersion": version,
                    "stableVersion": version,
                    "developmentVersion": version,
                    "versions": {version: version},
                    "path": p.path
                }
                if self.option(f"editable-{p.name}"):
                    mounts.append(
                        {
                            "source": str(Path(self.option(f"local-{p.name}")) / "docs"),
                            "target": str((self.DESTINATION / p.path / version).relative_to(self.DESTINATION.parent))
                        }
                    )
            else:
                versions = {v: v for v in p.versions}
                branches = get_branches(p)
                stable_version = next(iter([*versions.keys(), *branches]))
                project_params["documentation"] = {
                    "defaultVersion": stable_version,
                    "stableVersion": stable_version,
                    "developmentVersion": p.development_branch,
                    "versions": {
                        **branches,
                        **versions,
                    },
                    "path": p.path
                }
            
            params[p.name] = project_params

        params["projects"] = [p.name for p in _projects]
        config["params"] = params

        if len(mounts) > 0:
            mounts = [
                {
                    "source": "content",
                    "target": "content"
                },
                *mounts
            ]
            config["module"] = {"mounts": mounts}

        if file.exists():
            file.unlink()

        with open(file, "w") as f:
            yaml.dump(config, f)
        return config

    def handle(self) -> int:
        self.render()
        return 0


class DocsPullCommand(ConfigureCommand):
    name = "docs pull"

    description = "Pull the latest version of the documentation."

    def handle(self) -> int:
        content = get_configuration()

        if self.DESTINATION.is_symlink():
            self.DESTINATION.unlink()
        elif self.DESTINATION.exists():
            shutil.rmtree(self.DESTINATION)

        self.DESTINATION.mkdir(parents=True)

        with open(self.DESTINATION / "_index.md", "w") as f:
            f.write("---\n")
            f.write("title: \"\"\n")
            f.write("draft: false\n")
            f.write("layout: \"home\"\n")
            f.write("---\n")

        for p in _projects:
            project_params = content["params"][p.name]
            versions = project_params["documentation"]["versions"]
            default_version = project_params["documentation"]["defaultVersion"]
            destination = self.DESTINATION / p.path

            destination.mkdir(parents=True)
            with open(destination / "_index.md", "w") as f:
                f.write("---\n")
                f.write("title: \"Redirecting...\"\n")
                f.write("layout: redirect\n")
                f.write("params:\n")
                f.write(f"  url: \"/{p.name}/{default_version}/\"\n")
                f.write("---\n")

            if self.option(f"local-{p.name}"):
                if not self.option(f"editable-{p.name}"):
                    self._pull_local_version(
                        src=Path(self.option(f"local-{p.name}")),
                        dest=destination / default_version,
                        editable=self.option(f"editable-{p.name}"),
                    )
                continue

            versions_sorted = list(versions.items())
            versions_sorted.sort(key=lambda x: x[0] != default_version)

            for x in versions_sorted:
                k, v = x
                is_default = default_version == k
                self._pull_version(
                    project=p,
                    repo=p.repo_url,
                    version=k,
                    dest=destination,
                    name=v,
                    is_default=is_default,
                )

        return 0

    @staticmethod
    def _pull_local_version(src: Path, dest: Path, editable: bool = False) -> None:
        src = Path(src) / "docs"
        src = src.expanduser().resolve()
        if not src.exists():
            raise Exception(f"Source directory {src} does not exist")
        if not src.is_dir():
            raise Exception(f"Source {src} is not a directory")
        # Symlink directory to destination
        if dest.is_symlink():
            dest.unlink()
        elif dest.exists():
            shutil.rmtree(dest)
        if editable:
            dest.symlink_to(src, target_is_directory=True)
        else:
            # Copy files at the root of the destination
            for filepath in src.glob("**/*"):
                if not Path(filepath).is_file():
                    continue
                postfix = filepath.relative_to(src)
                target = dest / postfix
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(filepath, dest / postfix)

    def _pull_version(
        self,
        project: Project,
        repo: str,
        version: str,
        dest: Path,
        name: str | None = None,
        is_default: bool = False,
    ) -> None:
        self.line("")

        suffix = f" as <b>{name}</b>" if name else ""
        self.line(f"  Pulling documentation for version <b>{version}</b>{suffix}")

        cwd = Path.cwd()
        path = dest / (name if name else version)

        try:
            if path.exists():
                shutil.rmtree(path.as_posix())

            with temporary_directory() as tmp_dir:
                os.chdir(tmp_dir)
                tmp_dir = Path(tmp_dir)
                subprocess.run(
                    [
                        "git",
                        "clone",
                        "--single-branch",
                        "--branch",
                        version,
                        "--depth",
                        "1",
                        "--filter=blob:none",
                        "--sparse",
                        repo,
                        ".",
                    ]
                )
                subprocess.run(["git", "sparse-checkout", "init", "--cone"])
                subprocess.run(["git", "sparse-checkout", "set", "docs"])

                path.mkdir()
                docs_dir = tmp_dir / "docs"

                for filepath in docs_dir.glob("**/*"):
                    if not Path(filepath).is_file():
                        continue

                    postfix = filepath.relative_to(docs_dir)
                    target_path = path / postfix
                    target_path.parent.mkdir(parents=True, exist_ok=True)

                    if filepath.suffix == ".md":
                        with filepath.open() as f:
                            content = f.read()

                        # Load front matter data
                        _, frontmatter, content = content.split("---", maxsplit=2)
                        frontmatter = yaml.safe_load(frontmatter)
                        menu_names = list(frontmatter["menu"].keys())
                        params = frontmatter.get("params", {})
                        if menu_names:
                            entry = frontmatter["menu"][menu_names[0]]
                            name = f"{project.name}__{version}"
                            frontmatter["menu"] = {name: entry}
                            params["_menu"] = name
                        #if is_default and filepath.name == "_index.md" and filepath.parent.name == "docs":
                        #    frontmatter["aliases"] = [f"/{project.name}/", f"/{project.name}"]
                        frontmatter["params"] = {
                            **params,
                            "_version": version,
                            "_project": project.name,
                        }
                        new_frontmatter = yaml.dump(frontmatter).strip()
                        new_content = f"---\n{new_frontmatter}\n---\n{content}"
                        with target_path.open("w") as f:
                            f.write(new_content)
                    else:
                        shutil.copyfile(filepath, target_path)

            with open(path / "search_index.md", "w") as f:
                f.write("---\n")
                f.write("params:\n")
                f.write(f"  _menu: \"{project.name}__{version}\"\n")
                f.write(f"  _project: \"{project.name}\"\n")
                f.write(f"  _version: \"{version}\"\n")
                f.write("type: json\n")
                f.write("layout: search_index\n")
                f.write(f"url: \"/{project.name}/{version}/search_index.json\"\n")
                f.write("---\n")

        finally:
            os.chdir(cwd.as_posix())


class BuildCommand(DocsPullCommand):
    name = "build"
    description = "Render website configuration and generate assets"

    def handle(self) -> int:
        self.render()
        return super().handle()


class BuildSearchIndexCommand(Command):
    name = "build-search-index"
    description = "Generate website search index."
    options: ClassVar[list[Option]] = list(
        itertools.chain.from_iterable(
            [
                [
                    option(
                        f"local-{p.name}",
                        None,
                        f"Build from local {p.display_name} source.",
                        flag=False,
                    ),
                    option(
                        f"editable-{p.name}",
                        None,
                        f"Symlink local {p.display_name} source rather than copying.",
                    ),
                ]
                for p in _projects
            ]
        )
    )

    def build_search_index(self, file: Path | None = None) -> None:
        output_dir = Path(__file__).parent.parent / "public"
        config = get_configuration()

        for p in _projects:
            project_params = config["params"][p.name]
            versions = project_params["documentation"]["versions"]

            for v in versions:
                self.build_search_index_for_project_version(output_dir / p.name / v)

    @staticmethod
    def build_search_index_for_project_version(dir: Path) -> None:
        from parser import Parser
        search_index_path = dir / "search_index.json"
        if search_index_path.exists():
            with open(search_index_path, "r", encoding="utf-8") as f:
                search_index = json.load(f)

            print(f"Loaded search index from {search_index_path} with {len(search_index)} entries")

            new_index = []

            for entry in search_index:
                parser = Parser()
                parser.feed(entry["text"])
                parser.close()

                for section in parser.data:
                    if not section.is_excluded():
                        if not section.title:
                            section.title = [str(entry["title"])]
                        title = "".join(section.title).strip()
                        text = "".join(section.text).strip()
                        location = entry["location"]
                        if section.id:
                            location += f"#{section.id}"
                        new_index.append({"location": location, "title": title, "text": text, "tags": entry["tags"]})

            print(f"Processed search index with {len(new_index)} entries")

            with open(search_index_path, "w", encoding="utf-8") as f:
                json.dump(new_index, f, indent=2)
                print(f"Wrote search index to {search_index_path}")
        else:
            print(f"Search index file not found at {search_index_path}")

    def handle(self) -> int:
        self.build_search_index()
        return 0


app = Application()
app.add(ConfigureCommand())
app.add(DocsPullCommand())
app.add(BuildCommand())
app.add(BuildSearchIndexCommand())


if __name__ == "__main__":
    app.run()
