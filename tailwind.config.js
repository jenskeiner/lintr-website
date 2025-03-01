const colors = require("tailwindcss/colors")

module.exports = {
  mode: "jit",
  content: ["./layouts/**/*.html", "./assets/src/**/*.js"],
  darkMode: "class",
  theme: {
    fontFamily: {
      mono: '"Jetbrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      sans: '"Inter var", -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Ubuntu,sans-serif',
    },
    extend: {
      colors: {
        green: colors.green,
        blue: colors.blue,
        gray: colors.slate,
        cyan: colors.cyan,
        red: colors.rose,
        yellow: colors.amber,
        orange: colors.orange,
        primary: {
          50: "#f3f5f9",
          100: "#e6ecf4",
          200: "#c2cfe3",
          300: "#9db1d1",
          400: "#5377af",
          500: "hsl(200deg 88% 29%)",
          600: "#08377f",
          700: "#072e6a",
          800: "#052555",
          900: "#041e45",
        },
        secondary: {
          50: "#f5f5fc",
          100: "#ecebfa",
          200: "#cfcdf2",
          300: "#b2afe9",
          400: "#7973d9",
          500: "#3f37c9",
          600: "#3932b5",
          700: "#2f2997",
          800: "#262179",
          900: "#1f1b62",
        },
        code: colors.orange,
        "light-primary": "hsl(200deg 100% 99%)",
        "light-note": "hsl(200deg 33% 95%)",
        "light-note-darker": "hsl(200deg 33% 25%)",
        "dark-note-darker": "hsl(200deg 33% 25%)",
        link: colors.blue["500"],
        "link-hover": colors.blue["400"],
        "dark-primary": "hsl(200deg 90% 90%)",
        "dark-secondary": "hsl(200deg 33% 17%)",
        "dark-code": "hsl(200deg 33% 12%)",
        highlight: "#012a4a",
      },
      fontSize: {
        base: "1.2rem",
      },
      maxWidth: {
        "11/12": "91.666667%",
      },
      zIndex: {
        100: 100,
        200: 200,
        1000: 1000,
      },
      border: {
        primary: "#93D8D",
      },
      boxShadow: {
        "clean-sm": "0 1px 2px 0 hsl(240deg, 20%, 90%)",
        clean:
          "0 1px 3px 0 hsl(240deg, 20%, 90%), 0 1px 2px 0 hsl(240deg, 20%, 90%)",
        "clean-md":
          "0 4px 6px -1px hsl(220deg, 20%, 90%), 0 2px 4px -1px hsl(220deg, 20%, 90%)",
        "clean-lg":
          "0 10px 15px -3px hsl(220deg, 20%, 90%), 0 4px 6px -2px hsl(220deg, 20%, 90%)",
        "clean-dark-sm": "0 1px 2px 0 hsl(217deg, 32%, 12%)",
        "clean-dark":
          "0 1px 3px 0 hsl(217deg, 32%, 12%), 0 1px 2px 0 hsl(217deg, 32%, 12%)",
        "clean-dark-md":
          "0 4px 6px -1px hsl(217deg, 32%, 12%), 0 2px 4px -1px hsl(217deg, 32%, 12%)",
        "clean-dark-lg":
          "0 10px 15px -3px hsl(217deg, 32%, 12%), 0 4px 6px -2px hsl(217deg, 32%, 12%)",
      },
    },
  },
  variants: {
    extend: {
      ringWidth: ["active"],
      ringColor: ["active"],
      borderWidth: ["active"],
      borderColor: ["active"],
    },
  },
  safelist: [
    "grid",
    "sm:grid-cols-2",
    "md:grid-cols-3",
    "gap-4",
    "dark:bg-dark-secondary",
    "dark:hover:bg-dark-secondary",
    "border-green-500",
    "dark:border-green-300",
    "dark:bg-dark-code",
  ],
}
