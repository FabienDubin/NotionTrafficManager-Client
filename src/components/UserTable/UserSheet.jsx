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

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { toast } = useToast();

  const handleClose = () => {
    setOpen(false);
    if (onSave) onSave();
  };

  const validatePassword = (password) => {
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    return passwordRegex.test(password);
  };

  const handlePasswordChange = async () => {
    setPasswordError("");

    if (!newPassword || !confirmPassword) {
      setPasswordError("Veuillez remplir tous les champs");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!validatePassword(newPassword)) {
      setPasswordError(
        "Le mot de passe doit contenir au moins 6 caractères, 1 majuscule, 1 minuscule et 1 chiffre"
      );
      return;
    }

    try {
      await userService.changeUserPassword(user._id, newPassword);
      toast({
        title: "Mot de passe modifié",
        description: `Le mot de passe de ${user.firstName} a été mis à jour avec succès`,
      });

      setIsPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(
        error.response?.data?.message ||
          "Erreur lors du changement de mot de passe"
      );
    }
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
            {isEditMode && window.location.pathname === "/dashboard/users" && (
              <div className="border-t pt-4 mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 🔐 Password Modal rendu hors du Sheet */}
      {isEditMode && window.location.pathname === "/dashboard/users" && (
        <Dialog
          open={isPasswordModalOpen}
          onOpenChange={setIsPasswordModalOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Changer le mot de passe</DialogTitle>
              <DialogDescription>
                Saisissez le nouveau mot de passe pour {user.firstName}{" "}
                {user.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nouveau mot de passe</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Au moins 6 caractères, 1 majuscule, 1 minuscule, 1 chiffre"
                />
              </div>
              <div>
                <Label>Confirmer le mot de passe</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez le mot de passe"
                />
              </div>
              {passwordError && (
                <div className="text-red-500 text-sm">{passwordError}</div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
              >
                Annuler
              </Button>
              <Button onClick={handlePasswordChange}>Confirmer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default UserSheet;
