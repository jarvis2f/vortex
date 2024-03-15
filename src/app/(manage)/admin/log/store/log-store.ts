import { create } from "zustand";
import { type LogsInput } from "~/lib/types/trpc";

interface LogParams {
  limit?: number;
  levels: string[];
  agentId?: string;
  jql?: boolean;
  keyword: string;
  startDate: string;
  endDate: string;
}

interface LogStore {
  params: LogParams;
  liveMode: boolean;
}

interface LogStoreAction {
  setParams: (params: LogParams) => void;
  resetParams: () => void;
  isFiltering: () => boolean;
  convertParams: () => LogsInput;
  setLiveMode: (liveMode: boolean) => void;
}

const defaultParams: LogParams = {
  limit: 30,
  levels: [],
  agentId: "",
  keyword: "",
  startDate: "",
  endDate: "",
};

export const useLogStore = create<LogStore & LogStoreAction>()((set, get) => ({
  params: defaultParams,
  liveMode: false,
  setParams: (params: LogParams) => {
    set({ params });
  },
  resetParams: () => {
    set({
      params: defaultParams,
    });
  },
  isFiltering: () => {
    const { levels, keyword, startDate, endDate } = get().params;
    return (
      levels.length > 0 || keyword !== "" || startDate !== "" || endDate !== ""
    );
  },
  convertParams: () => {
    const { limit, levels, agentId, jql, keyword, startDate, endDate } =
      get().params;
    const numLevels = levels.map((level) => parseInt(level));
    const params: LogsInput = {
      limit,
      agentId: agentId ?? undefined,
      levels: numLevels,
      jql: jql ?? undefined,
      keyword: keyword ?? undefined,
      startDate: startDate === "" ? undefined : new Date(startDate),
      endDate: endDate === "" ? undefined : new Date(endDate),
    };
    return params;
  },
  setLiveMode: (liveMode: boolean) => {
    set({ liveMode });
  },
}));
