import type { Preview } from "@storybook/react";
import React, { useEffect } from "react";
import "../src/styles/tokens.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
  globalTypes: {
    theme: {
      name: "Tema",
      description: "Alternar entre modo claro y modo oscuro",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Modo Claro" },
          { value: "dark", icon: "moon", title: "Modo Oscuro" },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light";

      useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }, [theme]);

      return (
        <div
          className={`p-6 transition-colors min-h-[120px] rounded-xl flex items-center justify-center ${
            theme === "dark" ? "dark bg-[#0b0e0c] text-[#f1f3ee]" : "bg-[#f3efe6] text-[#171a17]"
          }`}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
