"use client";

import { useEffect, useState } from "react";
import { CreateServerModal } from "@/components/modals/CreateServerModal";
import { InviteModal } from "@/components/modals/InviteModal";
import { EditServerModal } from "@/components/modals/EditServerModal";
import { DeleteServerModal } from "@/components/modals/DeleteServerModal";
import { LeaveServerModal } from "@/components/modals/LeaveServerModal";
import { CreateChannelModal } from "@/components/modals/CreateChannelModal";
import { DeleteChannelModal } from "@/components/modals/DeleteChannelModal";
import { MembersModal } from "@/components/modals/MembersModal";
import { MessageFileModal } from "@/components/modals/MessageFileModal";
import { DeleteMessageModal } from "@/components/modals/DeleteMessageModal";
import { UserSettingsModal } from "@/components/modals/UserSettingsModal";
import { ChangeNicknameModal } from "@/components/modals/ChangeNicknameModal";
import { ImageViewerModal } from "@/components/modals/ImageViewerModal";
import { EditChannelModal } from "@/components/modals/EditChannelModal";
import { DMSearchModal } from "@/components/modals/DMSearchModal";



export function ModalProvider() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <CreateServerModal />
      <InviteModal />
      <EditServerModal />
      <DeleteServerModal />
      <LeaveServerModal />
      <CreateChannelModal />
      <DeleteChannelModal />
      <EditChannelModal />
      <MembersModal />
      <MessageFileModal />
      <DeleteMessageModal />

      <UserSettingsModal />
      <ChangeNicknameModal />
      <ImageViewerModal />
      <DMSearchModal />
    </>
  );
}
