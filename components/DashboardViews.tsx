"use client";

import { useDashboard } from "@/components/DashboardContext";
import DashboardMemberList from "@/components/DashboardMemberList";
import FamilyTree from "@/components/FamilyTree";
import MindmapTree from "@/components/MindmapTree";
import RootSelector from "@/components/RootSelector";
import { Person, Relationship } from "@/types";
import { useMemo } from "react";

interface DashboardViewsProps {
  persons: Person[];
  relationships: Relationship[];
  canEdit?: boolean;
}

export default function DashboardViews({
  persons,
  relationships,
  canEdit = false,
}: DashboardViewsProps) {
  const { view: currentView, rootId } = useDashboard();

  // Prepare map and roots for tree views
  const { personsMap, roots, defaultRootId } = useMemo(() => {
    const pMap = new Map<string, Person>();
    persons.forEach((p) => pMap.set(p.id, p));

    const childIds = new Set(
      relationships
        .filter(
          (r) => r.type === "biological_child" || r.type === "adopted_child",
        )
        .map((r) => r.person_b),
    );

    let calculatedRoots: Person[] = [];
    let finalRootId = rootId;

    if (finalRootId && pMap.has(finalRootId)) {
      calculatedRoots = [pMap.get(finalRootId)!];
    } else {
      // Khi chọn "Hiển thị toàn bộ" (finalRootId == null)
      const rootsFallback = persons.filter((p) => {
        // 1. Kiểm tra xem có ai không là con của bất kỳ ai không
        if (childIds.has(p.id)) return false;

        // 2. Nếu thỏa mãn thì kiểm tra "các" vợ/chồng của người đó có không là con của bất kỳ ai không
        const spouses = relationships.filter(
          (r) =>
            r.type === "marriage" && (r.person_a === p.id || r.person_b === p.id)
        );

        for (const spouseRel of spouses) {
          const spouseId = spouseRel.person_a === p.id ? spouseRel.person_b : spouseRel.person_a;

          // Nếu vợ/chồng là con của ai đó -> người này KHÔNG làm gốc
          if (childIds.has(spouseId)) {
            return false;
          }

          const spouse = pMap.get(spouseId);
          if (spouse) {
            // "Mỗi gốc thì là vợ chồng thì người chồng sẽ đứng trước" -> Chọn người nam làm đại diện 1 gốc
            if (p.gender !== "male" && spouse.gender === "male") {
              return false; // Yield to male spouse
            }
            // Tie breaker for same gender (e.g both unknown, or both male)
            if (p.gender === spouse.gender && p.id > spouse.id) {
              return false;
            }
          }
        }

        return true;
      });

      console.log("==== DANH SÁCH NHỮNG NGƯỜI KHÔNG CÓ BỐ/MẸ TRONG GIA PHẢ ====");
      const noParents = persons.filter((p) => !childIds.has(p.id));
      noParents.forEach(p => console.log(`- ${p.full_name} (ID: ${p.id})`));
      console.log("=============================================================");

      if (rootsFallback.length > 0) {
        calculatedRoots = rootsFallback;
      } else if (persons.length > 0) {
        // ultimate fallback if circular references exist
        calculatedRoots = [persons[0]];
      }
      finalRootId = null;

      console.log(">>>> DANH SÁCH CÁC NGƯỜI ĐƯỢC CHỌN LÀM GỐC <<<<");
      calculatedRoots.forEach(p => console.log(`- ${p.full_name} (ID: ${p.id})`));
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    }

    return {
      personsMap: pMap,
      roots: calculatedRoots,
      defaultRootId: finalRootId,
    };
  }, [persons, relationships, rootId]);

  const activeRootId = rootId !== undefined ? rootId : defaultRootId;

  return (
    <>
      <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col">
        {currentView !== "list" && persons.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full flex flex-col sm:flex-row flex-wrap items-center sm:justify-between gap-4 relative z-20">
            <RootSelector persons={persons} currentRootId={activeRootId} />
            <div
              id="tree-toolbar-portal"
              className="flex items-center gap-2 flex-wrap justify-center"
            />
          </div>
        )}

        {currentView === "list" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
            <DashboardMemberList initialPersons={persons} canEdit={canEdit} />
          </div>
        )}

        <div className="flex-1 w-full relative z-10">
          {currentView === "tree" && (
            <FamilyTree
              personsMap={personsMap}
              relationships={relationships}
              roots={roots}
              canEdit={canEdit}
            />
          )}
          {currentView === "mindmap" && (
            <MindmapTree
              personsMap={personsMap}
              relationships={relationships}
              roots={roots}
              canEdit={canEdit}
            />
          )}
        </div>
      </main>
    </>
  );
}
