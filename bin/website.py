#!/usr/bin/env python
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "cleo>=1.0.0a5",
#   "PyYAML>=6.0",
#   "tomli>=2.0",
#   "httpx>=0.23",
#   "tomli-w>=1.0",
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

from contextlib import contextmanager
from pathlib import Path
from typing import TYPE_CHECKING
from typing import Any

import httpx
import tomli
import tomli_w
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


class LintrProject(Project):
    @property
    def repo(self) -> str:
        return "jenskeiner/lintr"

    @property
    def name(self) -> str:
        return "lintr"

    @property
    def display_name(self) -> str:
        return "Lintr"

    @property
    def display_name_short(self) -> str:
        return "Lintr"

    @property
    def valid_branches(self) -> Iterable[str]:
        return ["develop", "main"]


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


class ConfigureCommand(Command):
    name = "configure"
    description = "Generate website config.toml file."
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

    @staticmethod
    def get_configuration(file: Path | None = None) -> dict[str, Any]:
        if file is None:
            file = Path(__file__).parent.parent / "pyproject.toml"

        return tomli.loads(file.read_text())["tool"]["website"]

    def render(self, file: Path | None = None) -> None:
        if file is None:
            file = Path(__file__).parent.parent / "config.toml"

        content = self.get_configuration()
        config = content["config"]

        for p in _projects:
            config["params"][p.name]["name"] = p.display_name
            config["params"][p.name]["name_short"] = p.display_name_short
            config["params"][p.name]["repo_url"] = p.repo_url_without_extension
            config["params"][p.name]["documentation"]["path"] = p.path
            if self.option(f"local-{p.name}"):
                version: str = "development"
                config["params"][p.name]["documentation"]["defaultVersion"] = version
                config["params"][p.name]["documentation"]["versions"] = {
                    version: version
                }
                config["params"][p.name]["documentation"]["stableVersion"] = version
                config["params"][p.name]["documentation"][
                    "developmentVersion"
                ] = version
            else:
                versions = content[p.name]["versions"]
                branches = get_branches(p)
                config["params"][p.name]["documentation"]["versions"] = {
                    **branches,
                    **versions,
                }
                config["params"][p.name]["documentation"]["stableVersion"] = next(
                    iter(versions.keys())
                )
                config["params"][p.name]["documentation"][
                    "developmentVersion"
                ] = p.development_branch

        config["params"]["projects"] = [p.name for p in _projects]

        if file.exists():
            file.unlink()

        file.write_text(tomli_w.dumps(config))
        return config

    def handle(self) -> int:
        self.render()
        return 0


class DocsPullCommand(ConfigureCommand):
    DESTINATION: Path = Path(__file__).parent.parent / "content/docs"

    name = "docs pull"

    description = "Pull the latest version of the documentation."

    def handle(self) -> int:
        content = self.get_configuration()

        if self.DESTINATION.is_symlink():
            self.DESTINATION.unlink()
        elif self.DESTINATION.exists():
            shutil.rmtree(self.DESTINATION)

        for p in _projects:
            versions = content[p.name]["versions"]
            branches = get_branches(p)
            default_version = content["config"]["params"][p.name]["documentation"][
                "defaultVersion"
            ]
            destination = self.DESTINATION / p.path

            destination.mkdir(parents=True)

            if self.option(f"local-{p.name}"):
                self._pull_local_version(
                    src=Path(self.option(f"local-{p.name}")),
                    dest=destination,
                    editable=self.option(f"editable-{p.name}"),
                )
                continue

            items: dict = dict(**branches, **versions)
            items: list = list(items.items())
            items.sort(key=lambda x: x[0] != default_version)

            for x in items:
                k, v = x
                is_default = default_version == k
                self._pull_version(
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
        if editable:
            # Symlink directory to destination
            dest.rmdir()
            dest.symlink_to(src, target_is_directory=True)
        else:
            # Copy files at the root of the destination
            for filepath in src.glob("**/*.md"):
                postfix = filepath.relative_to(src)
                target = dest / postfix
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(filepath, dest / postfix)

    def _pull_version(
        self,
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

                if is_default:
                    self._pull_local_version(tmp_dir, dest)
                else:
                    path.mkdir()
                    docs_dir = tmp_dir / "docs"

                    for filepath in docs_dir.glob("**/*.md"):
                        postfix = filepath.relative_to(docs_dir)
                        target_path = path / postfix
                        target_path.parent.mkdir(parents=True, exist_ok=True)

                        if filepath.suffix == ".md":
                            with filepath.open() as f:
                                content = f.read()

                            # Load front matter data
                            _, frontmatter, content = content.split("---", maxsplit=2)
                            frontmatter = yaml.safe_load(frontmatter)
                            frontmatter["title"] += f" | {version}"
                            menu_name = list(frontmatter["menu"].keys()).pop()
                            menu_name0 = f"{menu_name}_{version}"
                            frontmatter["menu"] = {menu_name0: frontmatter["menu"][menu_name]}
                            new_frontmatter = yaml.dump(frontmatter).strip()
                            new_content = f"---\n{new_frontmatter}\n---\n{content}"
                            with target_path.open("w") as f:
                                f.write(new_content)
                        else:
                            shutil.copyfile(filepath, target_path)
        finally:
            os.chdir(cwd.as_posix())


class BuildCommand(DocsPullCommand):
    name = "build"
    description = "Render website configuration and generate assets"

    def handle(self) -> int:
        self.render()
        return super().handle()


app = Application()
app.add(ConfigureCommand())
app.add(DocsPullCommand())
app.add(BuildCommand())


if __name__ == "__main__":
    app.run()
