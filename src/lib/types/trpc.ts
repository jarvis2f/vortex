import type { RouterInputs, RouterOutputs } from "~/trpc/shared";

export type UserGetAllOutput = RouterOutputs["user"]["getAll"]["users"][0];
export type AgentGetAllOutput = RouterOutputs["agent"]["getAll"];
export type AgentGetAllOutputItem =
  RouterOutputs["agent"]["getAll"]["ONLINE"][0];
export type AgentGetOneOutput = RouterOutputs["agent"]["getOne"];
export type ForwardGetAllOutput =
  RouterOutputs["forward"]["getAll"]["forwards"][0];
export type NetworkGetAllOutput =
  RouterOutputs["network"]["getAll"]["networks"][0];
export type NetworkGetOneOutput = RouterOutputs["network"]["getOne"];
export type LogsOutput = RouterOutputs["log"]["getLogs"]["logs"][0];
export type LogsInput = RouterInputs["log"]["getLogs"];
export type RechargeCodeGetAllOutput =
  RouterOutputs["rechargeCode"]["getAll"]["rechargeCodes"][0];
export type PaymentGetAllOutput =
  RouterOutputs["payment"]["getAll"]["payments"][0];
export type WithdrawalGetAllOutput =
  RouterOutputs["withdrawal"]["getAll"]["withdrawals"][0];
export type TicketGetAllOutput =
  RouterOutputs["ticket"]["getAll"]["tickets"][0];
