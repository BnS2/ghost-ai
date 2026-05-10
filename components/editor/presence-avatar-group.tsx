"use client";

import { useUser } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";

const VISIBLE_COLLABORATOR_LIMIT = 5;

interface CollaboratorAvatar {
  avatar: string;
  color: string;
  id: string;
  initials: string;
  name: string;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  return words
    .slice(0, 2)
    .map((word) => word.at(0)?.toUpperCase())
    .join("");
}

export function PresenceAvatarGroup() {
  const others = useOthers();
  const { user } = useUser();
  const currentUserId = user?.id;
  const currentUserName = "You";
  const currentUserInitials = getInitials(currentUserName);
  const collaborators = others
    .filter((participant) => participant.id !== currentUserId)
    .map<CollaboratorAvatar>((participant) => {
      const name = participant.info.name || "Collaborator";

      return {
        avatar: participant.info.avatar,
        color: participant.info.color,
        id: participant.id,
        initials: getInitials(name),
        name,
      };
    });
  const visibleCollaborators = collaborators.slice(0, VISIBLE_COLLABORATOR_LIMIT);
  const overflowCount = Math.max(0, collaborators.length - VISIBLE_COLLABORATOR_LIMIT);

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-30 flex h-10 items-center rounded-2xl border border-border-default bg-surface/85 px-2 shadow-xl backdrop-blur-md">
      {visibleCollaborators.length > 0 ? (
        <>
          <ul className="flex list-none items-center -space-x-2">
            {visibleCollaborators.map((collaborator) => (
              <li
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-bg-base bg-elevated text-[11px] font-bold text-text-primary ring-2 ring-border-subtle"
                key={collaborator.id}
                title={collaborator.name}
                style={{
                  backgroundColor: collaborator.avatar ? undefined : collaborator.color,
                  backgroundImage: collaborator.avatar ? `url(${collaborator.avatar})` : undefined,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              >
                {collaborator.avatar ? null : collaborator.initials}
              </li>
            ))}
            {overflowCount > 0 ? (
              <li className="flex h-8 min-w-8 items-center justify-center rounded-full border border-bg-base bg-subtle px-2 text-[11px] font-bold text-text-secondary ring-2 ring-border-subtle">
                +{overflowCount}
              </li>
            ) : null}
          </ul>
          <div className="mx-2 h-6 w-px bg-border-subtle" />
        </>
      ) : null}
      <div
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-bg-base bg-elevated text-[11px] font-bold text-text-primary ring-2 ring-border-subtle"
        title={currentUserName}
        style={{
          backgroundImage: user?.imageUrl ? `url(${user.imageUrl})` : undefined,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        {user?.imageUrl ? null : currentUserInitials}
      </div>
    </div>
  );
}
