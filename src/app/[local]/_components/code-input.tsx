import React, { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { esLint, javascript } from "@codemirror/lang-javascript";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { type Extension } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import prettier from "prettier";
import parser from "prettier/parser-babel";
import mk_parser from "prettier/parser-markdown";
import * as eslint from "eslint-linter-browserify";
import { linter, lintGutter } from "@codemirror/lint";
import { ClipboardTypeIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/lib/ui/tooltip";
import { useTranslations } from "use-intl";

interface CodeInputProps {
  className?: string;
  value?: string;
  height?: string;
  onChange?: (value: string) => void;
  language?: "javascript" | "json" | "markdown";
  placeholder?: string;
  theme?: "dark" | "light";
  onError?: (error: Error | null) => void;
}

const CodeInput: React.FC<CodeInputProps> = ({
  className,
  value = "",
  height = "200px",
  onChange,
  language = "javascript",
  placeholder = "",
  theme = "dark",
  onError,
}) => {
  const [code, setCode] = useState("");
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const t = useTranslations("global_code-input");
  useEffect(() => {
    if (language === "json") {
      try {
        value = JSON.stringify(JSON.parse(value), null, 2);
      } catch (e) {
        onError && onError(e as Error);
      }
    }
    setCode(value);
  }, [value]);

  useEffect(() => {
    const extensions: Extension[] = [];
    if (language === "javascript") {
      extensions.push(javascript({ jsx: false }));
      extensions.push(linter(esLint(new eslint.Linter(), config)));
    } else if (language === "json") {
      extensions.push(json());
      extensions.push(linter(jsonParseLinter()));
    } else if (language === "markdown") {
      extensions.push(markdown());
    }
    setExtensions(extensions);
  }, [language]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onError && onError(null);
    if (language === "json") {
      try {
        const parsedJson = JSON.parse(newCode);
        const compressedJson = JSON.stringify(parsedJson, null, 0);
        onChange && onChange(compressedJson);
      } catch (e) {
        onError && onError(e as Error);
      }
    } else {
      onChange && onChange(newCode);
    }
  };

  const handleFormat = async () => {
    let formattedCode = "";
    if (language === "json") {
      try {
        const parsedJson = JSON.parse(code);
        formattedCode = JSON.stringify(parsedJson, null, 2);
      } catch (e) {
        onError && onError(e as Error);
      }
    } else if (language === "javascript") {
      try {
        formattedCode = await prettier.format(code, {
          parser: "babel",
          plugins: [parser],
          semi: false,
        });
      } catch (e) {
        onError && onError(e as Error);
      }
    } else if (language === "markdown") {
      try {
        formattedCode = await prettier.format(code, {
          parser: "markdown",
          plugins: [mk_parser],
          semi: false,
        });
      } catch (e) {
        onError && onError(e as Error);
      }
    }
    handleCodeChange(formattedCode);
  };

  const config = {
    parserOptions: {
      ecmaVersion: 2019,
      sourceType: "module",
    },
    env: {
      browser: false,
      node: true,
    },
    rules: {
      "no-undef": "error",
      "no-use-before-define": "error",
      "no-debugger": "error",
      "no-dupe-args": "error",
      "no-dupe-keys": "error",
      "no-empty-function": "error",
    },
  };

  return (
    <div className={cn("relative", className)}>
      <CodeMirror
        className="h-full max-w-full overflow-y-scroll"
        value={code}
        extensions={[...extensions, lintGutter()]}
        theme={theme}
        placeholder={placeholder}
        width="100%"
        height={height}
        minHeight="500px"
        onChange={(value: string) => {
          handleCodeChange(value);
        }}
      />
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <ClipboardTypeIcon
            className={cn(
              "absolute right-[10px] top-[10px] h-5 w-5 cursor-pointer text-white hover:text-gray-400",
              theme === "light" && "text-gray-800 hover:text-gray-600",
            )}
            onClick={handleFormat}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="flex items-center gap-4">
          {t("format")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default CodeInput;
