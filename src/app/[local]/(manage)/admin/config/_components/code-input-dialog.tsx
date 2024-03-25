import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/ui/dialog";
import CodeInput from "~/app/[local]/_components/code-input";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "~/lib/ui/tabs";
import Markdown from "react-markdown";

interface CodeInputDialogProps {
  title: string;
  language?: "javascript" | "json" | "markdown";
  value: string;
  onChange: (value: string) => void;
}

export default function CodeInputDialog({
  title,
  language = "json",
  value,
  onChange,
}: CodeInputDialogProps) {
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <textarea
          className="w-full rounded border p-2 text-sm"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      </DialogTrigger>
      <DialogContent className="flex max-h-[66%] min-h-[40%] w-2/3 max-w-none flex-col">
        <DialogHeader className="flex-row items-center space-x-3">
          <DialogTitle>{title}</DialogTitle>
          {language === "markdown" && (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            >
              <TabsList>
                <TabsTrigger value="edit">编辑</TabsTrigger>
                <TabsTrigger value="preview">预览</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </DialogHeader>
        {activeTab === "preview" && language === "markdown" && (
          <Markdown className="markdown">{value}</Markdown>
        )}
        {activeTab === "edit" && (
          <CodeInput
            className="h-full flex-1 overflow-x-scroll"
            value={value}
            height={"100%"}
            onChange={onChange}
            language={language}
            onError={setError}
          />
        )}
        {error && <p className="mt-2 text-sm text-red-500">{error.message}</p>}
      </DialogContent>
    </Dialog>
  );
}
