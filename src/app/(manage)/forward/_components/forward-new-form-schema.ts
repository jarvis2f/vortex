import { z } from "zod";
import { ForwardMethod } from ".prisma/client";
import { type UseFormReturn } from "react-hook-form";

export const forwardFormSchema = z.object({
  agentId: z.string().min(1, {
    message: "请选择中转服务器",
  }),
  method: z.nativeEnum(ForwardMethod),
  options: z.any().optional(),
  agentPort: z
    .preprocess(
      (a) => (a ? parseInt(z.string().parse(a), 10) : undefined),
      z
        .number()
        .positive()
        .min(1, {
          message: "监听端口必须大于 0",
        })
        .max(65535, {
          message: "监听端口必须小于 65536",
        }),
    )
    .optional(),
  targetPort: z.preprocess(
    (a) => (a ? parseInt(z.string().parse(a), 10) : undefined),
    z
      .number()
      .positive()
      .min(1, {
        message: "目标端口必须大于 0",
      })
      .max(65535, {
        message: "目标端口必须小于 65536",
      }),
  ),
  target: z.string().min(1, {
    message: "转发目标不能为空",
  }),
  remark: z.string().optional(),
});

export type ForwardFormValues = z.infer<typeof forwardFormSchema>;

export type ForwardForm = UseFormReturn<ForwardFormValues>;
