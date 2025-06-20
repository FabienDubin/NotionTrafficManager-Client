import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const nav = useNavigate();

  return (
    <div className="h-screen flex items-center">
      <h1 className="text-9xl font-bold mx-4 my-8 drop-shadow-xl">
        Welcome to the home page
      </h1>
      <Button onClick={() => nav("/calendar")}>Calendar</Button>
    </div>
  );
};

export default Home;
