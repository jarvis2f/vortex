import { z } from "zod";
import { BYTE_UNITS } from "~/lib/utils";

export const trafficPriceSchema = z.object({
  price: z.preprocess(
    (a) => (a ? parseFloat(z.string().parse(a)) : undefined),
    z.number(),
  ),
  unit: z.string().refine((value) => Object.keys(BYTE_UNITS).includes(value)),
});
