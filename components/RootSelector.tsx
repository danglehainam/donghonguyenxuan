"use client";

import { Person } from "@/types";
import { useDashboard } from "./DashboardContext";
import PersonSelector from "./PersonSelector";

export default function RootSelector({
  persons,
  currentRootId,
}: {
  persons: Person[];
  currentRootId: string | null;
}) {
  const { setRootId } = useDashboard();

  return (
    <PersonSelector
      persons={persons}
      selectedId={currentRootId}
      onSelect={(id) => {
        setRootId(id);
      }}
      placeholder="Chọn người..."
      label="Gốc hiển thị"
      className="w-full sm:w-72"
      showAllOption={true}
      allOptionLabel="Hiển thị toàn bộ"
    />
  );
}
