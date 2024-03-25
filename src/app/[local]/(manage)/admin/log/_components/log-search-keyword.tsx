import { useLogStore } from "~/app/[local]/(manage)/admin/log/store/log-store";
import { Popover, PopoverContent, PopoverTrigger } from "~/lib/ui/popover";
import { Input } from "~/lib/ui/input";
import React, { useEffect } from "react";
import { Switch } from "~/lib/ui/switch";
import { Label } from "~/lib/ui/label";
import { Textarea } from "~/lib/ui/textarea";
import { Button } from "~/lib/ui/button";

export default function LogSearchKeyword() {
  const { params, setParams } = useLogStore();
  const [open, setOpen] = React.useState(false);
  const [jql, setJql] = React.useState(params.jql);
  const [keyword, setKeyword] = React.useState(params.keyword);

  useEffect(() => {
    setJql(params.jql);
    setKeyword(params.keyword);
  }, [params.jql, params.keyword]);

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          className="h-8 w-[250px] lg:w-[350px]"
          placeholder="Search for logs"
          value={params.keyword}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <Switch id="jql" checked={jql} onCheckedChange={setJql} />
            <Label htmlFor="jql">高级搜索</Label>
          </div>
          {jql && (
            <div className="text-xs text-foreground/50">
              <p>语法：path op value</p>
              <p>path格式：以.分割，如：a.b.c 查询a.b.c字段</p>
              <p>数组下标以[]包裹，如：a.b[0].c 查询a.b数组下标为0的c字段</p>
              <p>op支持：{"=, !=, like, <, <=, >, >="}</p>
            </div>
          )}
          <Textarea
            placeholder="默认模糊查询msg字段"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-16"
          />
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setParams({
                  ...params,
                  jql,
                  keyword,
                });
                setOpen(false);
              }}
            >
              搜索
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
