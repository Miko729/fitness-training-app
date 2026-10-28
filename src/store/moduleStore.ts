import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { workoutModules } from "../data/workoutModules";
import type { WorkoutModule } from "../types";

interface ModuleStore {
  modules: WorkoutModule[];
  saveModule: (module: WorkoutModule) => void;
}

const previousBuiltInModuleIds = new Set([
  "strength-a",
  "strength-b",
  "strength-c",
  "functional-coordination-core",
  "functional-upper-stability",
  "cardio-walk",
  "cardio-incline-walk",
  "full-rest",
]);

const builtInModuleIds = new Set([
  ...previousBuiltInModuleIds,
  ...workoutModules.map((module) => module.id),
]);

export const useModuleStore = create<ModuleStore>()(
  persist(
    (set) => ({
      modules: workoutModules,
      saveModule: (module) =>
        set((state) => {
          const exists = state.modules.some((item) => item.id === module.id);
          return {
            modules: exists
              ? state.modules.map((item) =>
                  item.id === module.id ? module : item,
                )
              : [...state.modules, module],
          };
        }),
    }),
    {
      name: "workout-module-store",
      storage: createJSONStorage(() => localStorage),
      version: 5,
      migrate: (persistedState, version) => {
        const persisted = persistedState as Partial<ModuleStore>;
        if (version >= 5 || !Array.isArray(persisted.modules)) {
          return persisted as ModuleStore;
        }

        return {
          modules: [
            ...workoutModules,
            ...persisted.modules.filter(
              (module) => !builtInModuleIds.has(module.id),
            ),
          ],
        };
      },
    },
  ),
);
