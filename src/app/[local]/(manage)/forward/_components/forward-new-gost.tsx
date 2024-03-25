import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/lib/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/lib/ui/select";
import { type ForwardForm } from "~/app/[local]/(manage)/forward/_components/forward-new-form-schema";
import { GostChannelOptions, GostProtocolOptions } from "~/lib/constants";
import { WithDescSelector } from "~/app/[local]/_components/with-desc-selector";

export default function ForwardNewGost({ form }: { form: ForwardForm }) {
  return (
    <>
      <FormField
        control={form.control}
        name="options"
        render={({ field }) => (
          <>
            <FormItem>
              <FormLabel>协议</FormLabel>
              <FormDescription>中转数据协议</FormDescription>
              <Select
                onValueChange={(v) =>
                  field.onChange({
                    ...field.value,
                    protocol: v,
                  })
                }
                defaultValue={field.value?.protocol}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GostProtocolOptions.map((protocol, index) => (
                    <SelectItem value={protocol.value} key={index}>
                      {protocol.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
            <FormItem>
              <FormLabel>通道</FormLabel>
              <FormDescription>中转数据通道</FormDescription>
              <WithDescSelector
                options={GostChannelOptions}
                value={field.value?.channel}
                onChange={(v) =>
                  field.onChange({
                    ...field.value,
                    channel: v,
                  })
                }
              />
              <FormMessage />
            </FormItem>
            {/*<FormItem>*/}
            {/*  <FormLabel>多路复用</FormLabel>*/}
            {/*  <FormDescription>*/}
            {/*    选择后开启*/}
            {/*  </FormDescription>*/}
            {/*  <Switch*/}
            {/*    checked={field.value?.mux === "true"}*/}
            {/*    onCheckedChange={(e) => field.onChange({*/}
            {/*      ...field.value,*/}
            {/*      mux: e ? "true" : "false",*/}
            {/*    })}*/}
            {/*  />*/}
            {/*  <FormMessage />*/}
            {/*</FormItem>*/}
          </>
        )}
      />
    </>
  );
}
