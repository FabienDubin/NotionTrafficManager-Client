import React, { useState, useEffect, createContext } from "react";
import authService from "@/services/auth.service";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

function AuthProviderWrapper({ children }) {
  //STATES
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  //NAVIGATION
  const nav = useNavigate();

  //FUNCTIONS
  //Store token in the local storage when the user is authenticated
  const storeToken = (token) => {
    localStorage.setItem("authToken", token);
  };

  //Verify the token and update the user state if the token is valid
  const authenticateUser = () => {
    setIsLoading(true);
    
    // Get the stored token from the localStorage
    const storedToken = localStorage.getItem("authToken");

    if (!storedToken) {
      setIsLoggedIn(false);
      setIsLoading(false);
      setUser(null);
      return;
    }

    // Vérification basique du format du token JWT
    try {
      const tokenParts = storedToken.split('.');
      if (tokenParts.length !== 3) {
        console.error("Invalid token format - removing from storage");
        localStorage.removeItem("authToken");
        setIsLoggedIn(false);
        setIsLoading(false);
        setUser(null);
        return;
      }
    } catch (error) {
      console.error("Error parsing token:", error);
      localStorage.removeItem("authToken");
      setIsLoggedIn(false);
      setIsLoading(false);
      setUser(null);
      return;
    }

    // Timeout pour éviter que isLoading reste bloqué à true
    const timeoutId = setTimeout(() => {
      console.warn("Authentication timeout - resetting auth state");
      setIsLoggedIn(false);
      setIsLoading(false);
      setUser(null);
    }, 10000); // 10 secondes timeout

    // call the authService to verify the token and update the user state if the token is valid
    authService
      .verify()
      .then((response) => {
        clearTimeout(timeoutId);
        // If the server verifies that JWT token is valid  ✅
        const user = response.data;
        // console.log(user);

        // Update state variables
        setIsLoggedIn(true);
        setIsLoading(false);
        setUser(user);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error("Authentication error:", error);
        
        // Gestion améliorée des différents types d'erreurs
        if (error.response) {
          const status = error.response.status;
          console.log(`Server responded with status: ${status}`);
          
          // Token invalide, expiré, ou utilisateur non trouvé
          if (status === 401) {
            console.log("Token invalid or expired - removing from storage");
            localStorage.removeItem("authToken");
          }
          // Erreur de base de données ou serveur indisponible
          else if (status === 503) {
            console.error("Database connection error on server");
          }
          // Autres erreurs serveur
          else if (status >= 500) {
            console.error("Server internal error - keeping token for retry");
          }
        } else if (error.request) {
          // Erreur réseau/connexion
          console.error("Network error - server unreachable");
        } else {
          console.error("Request setup error:", error.message);
        }
        
        // Update state variables
        setIsLoggedIn(false);
        setIsLoading(false);
        setUser(null);
      });
  };

  const removeToken = () => {
    localStorage.removeItem("authToken");
  };

  const logOutUser = () => {
    // Upon logout, remove the token from the localStorage
    removeToken();
    authenticateUser();
  };

  //When the user is updated, update the user state and localStorage with the new user data.
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser)); // Si tu stockes l'utilisateur en local
  };

  useEffect(() => {
    // Run this code once the AuthProviderWrapper component in the App loads for the first time.
    // This effect runs when the application and the AuthProviderWrapper component load for the first time.
    authenticateUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        user,
        storeToken,
        authenticateUser,
        updateUser,
        logOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProviderWrapper, AuthContext };
