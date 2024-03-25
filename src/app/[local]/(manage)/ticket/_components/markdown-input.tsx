import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/lib/ui/tabs";
import Markdown from "react-markdown";
import CodeInput from "~/app/[local]/_components/code-input";

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

export default function MarkdownInput({
  value,
  onChange,
  height = 400,
}: MarkdownInputProps) {
  return (
    <Tabs defaultValue="edit">
      <TabsList>
        <TabsTrigger value="edit">编辑</TabsTrigger>
        <TabsTrigger value="preview">预览</TabsTrigger>
      </TabsList>
      <TabsContent
        value="edit"
        style={{ height: `${height}px` }}
        className="overflow-y-scroll rounded-md border"
      >
        <CodeInput
          className="overflow-auto"
          value={value}
          onChange={onChange}
          language="markdown"
          theme="light"
        />
      </TabsContent>
      <TabsContent
        value="preview"
        className="overflow-y-scroll"
        style={{ height: `${height}px` }}
      >
        <Markdown className="markdown">{value}</Markdown>
      </TabsContent>
    </Tabs>
  );
}
