import React, { useContext, useState } from "react";
import userService from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Eye, EyeOff, Pencil, Send, Trash2 } from "lucide-react";
import { FALLBACK_IMG, DEFAULT_PASS } from "@/config/envVar.config";
import authService from "@/services/auth.service";
import { AuthContext } from "@/context/auth.context";
import { toast } from "sonner";

const UserForm = ({ user, onClose, handleDeleteUser }) => {
  const isEditMode = Boolean(user);
  const { user: authenticatedUser, updateUser } = useContext(AuthContext);

  const [formData, setFormData] = useState(
    user || {
      firstName: "",
      lastName: "",
      email: "",
      role: "user",
      image: null,
      password: DEFAULT_PASS,
    }
  );

  const [previewImage, setPreviewImage] = useState(user?.image || FALLBACK_IMG);
  const [imageFile, setImageFile] = useState(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const sendPasswordReset = async () => {
    if (!formData.email) {
      toast("Email is required", {
        description: "Please enter your email address",
        variant: "error",
      });
      return;
    }

    try {
      await authService.forgotPassword({ email: formData.email });
      toast("Password reset email sent", {
        description: "Check your inbox for further instructions",
        variant: "success",
      });
    } catch (error) {
      console.log(error);
    }
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
      toast("Mot de passe modifié", {
        description: `Le mot de passe de ${user.firstName} a été mis à jour avec succès`,
        variant: "success",
      });

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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let updatedUser = formData;

      if (imageFile) {
        const response = await userService.updateUserImage(
          formData._id,
          imageFile
        );
        updatedUser = { ...formData, image: response.data.updatedUser.image };
        setPreviewImage(response.data.updatedUser.image);
      }

      if (isEditMode) {
        await userService.updateUser(formData._id, updatedUser);
      } else {
        const response = await authService.signup(updatedUser);
        updatedUser = response.data;
      }

      if (window.location.pathname === "/dashboard/users") {
        onClose();
        toast(
          isEditMode
            ? `${user.firstName}'s profile updated`
            : "User created successfully!",
          {
            description: isEditMode
              ? "Everything is under control!"
              : `${formData.firstName} can now sign in with the default password: ${DEFAULT_PASS}`,
            variant: "success",
          }
        );
      }

      if (window.location.pathname === "/profile") {
        updateUser(updatedUser);
        toast("Your profile has been updated!", {
          description: "Everything is under control!",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  return (
    <form onSubmit={handleSave} className="my-5">
      {isEditMode && (
        <div className="flex flex-col gap-2">
          <Label>Profile Image</Label>
          <div className="flex items-center gap-4">
            <img
              src={previewImage}
              alt="Profile image"
              className="h-16 w-16 rounded-full object-cover"
            />
            <Label className="cursor-pointer border border-input bg-background shadow-sm rounded-md p-2">
              <Input
                type="file"
                className="hidden"
                onChange={handleImageChange}
              />
              <Pencil className="w-4 inline-block mr-2" /> Change
            </Label>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Label>First Name</Label>
        <Input
          name="firstName"
          placeholder="First Name"
          required
          value={formData.firstName}
          onChange={handleChange}
        />
      </div>

      <div className="mt-4">
        <Label>Last Name</Label>
        <Input
          name="lastName"
          required
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
        />
      </div>

      <div className="mt-4">
        <Label>Email</Label>
        <Input
          name="email"
          type="email"
          required
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      {window.location.pathname === "/dashboard/users" && (
        <div className="mt-4">
          <Label>Role</Label>
          <Select defaultValue={formData.role} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="w-full flex flex-col mt-4 gap-2">
        <Label>Password</Label>
        <Button
          className="w-full"
          onClick={(e) => {
            e.preventDefault();
            sendPasswordReset();
          }}
          variant="outline"
          disabled={!isEditMode}
        >
          <Send className="mr-2 w-4 h-4" />
          Send reset password
        </Button>

        {isEditMode && window.location.pathname === "/dashboard/users" && (
          <Accordion type="single" collapsible className="w-full mt-4">
            <AccordionItem value="password">
              <AccordionTrigger>
                <span className="text-sm font-medium">
                  🔐 Définir un mot de passe
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Au moins 6 caractères, 1 majuscule, 1 minuscule, 1 chiffre"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label>Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmez le mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {passwordError && (
                    <div className="text-red-500 text-sm">{passwordError}</div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handlePasswordChange}
                      variant="secondary"
                    >
                      Confirmer
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>

      <div className="flex justify-end mt-5">
        <Button type="submit" className="w-full mr-2">
          {isEditMode ? "Save" : "Create"}
        </Button>

        {window.location.pathname === "/dashboard/users" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mb-6 w-4">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete{" "}
                  {user?.firstName}'s user account and remove its data from our
                  servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500"
                  onClick={() => handleDeleteUser()}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
};

export default UserForm;
