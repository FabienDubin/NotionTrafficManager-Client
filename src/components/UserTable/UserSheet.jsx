import React, { useState } from "react";
import userService from "@/services/users.service";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Trash2, UserRoundPlus, Key } from "lucide-react";
import UserForm from "./UserForm";
import { useToast } from "@/hooks/use-toast";

const UserSheet = ({ user, onSave }) => {
  const isEditMode = Boolean(user);
  const [open, setOpen] = useState(false);

  // const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const { toast } = useToast();

  const handleClose = () => {
    setOpen(false);
    if (onSave) onSave();
  };

  const handleDeleteUser = async () => {
    try {
      await userService.deleteUser(user._id);
      toast({
        title: "Bye bye 👋",
        description: `${user.firstName} has been deleted`,
      });
      setOpen(false);
      onSave();
    } catch (error) {
      console.log(error);
      toast({
        title: "Oups, we've got a problem",
        description: "",
      });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {isEditMode ? (
            <MoreHorizontal />
          ) : (
            <Button className="mx-2">
              <UserRoundPlus />
              Create a user
            </Button>
          )}
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {isEditMode ? `Edit ${user.firstName}'s profile` : "Create User"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col justify-between h-full">
            <UserForm
              user={user}
              onClose={handleClose}
              handleDeleteUser={handleDeleteUser}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default UserSheet;
