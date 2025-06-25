import { AuthContext } from "@/context/auth.context";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { Bug, Users, Settings, BarChart3 } from "lucide-react";

import ChartTemplate from "@/components/Charts/ChartTemplate";
import PieChartTemplate from "@/components/Charts/PieChartTemplate";
import BarChartTemplate from "@/components/Charts/BarChartTemplate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

//DATA SAMPLES FOR THE CHARTS DATA AND CHART CONFIGURATION
//Should be defined in your actual data fetching function
//CHART
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
};

//PIE
const pieData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 287, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 190, fill: "var(--color-other)" },
];

const pieConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
};

//BAR
const barData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const barConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
};

const AdminDashboard = () => {
  //CONTEXT
  const { user } = useContext(AuthContext);

  return (
    <div className="w-full min-h-screen">
      <h1 className="text-2xl font-bold p-4">Hello {user.name}👋</h1>
      <h2
        className="text-xl font-medium px-4"
        data-testid="admin-dashboard-title"
      >
        Welcome to your admin dashboard!
      </h2>
      <p className="px-4 mt-6 text-gray-600 font-light">
        This is an example of dataviz you can display on that page
      </p>

      {/* Navigation rapide */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Accès rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link to="/dashboard/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Gestion des utilisateurs
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Gérer les comptes utilisateurs et les permissions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/bug-reports">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Bug Reports
                </CardTitle>
                <Bug className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Gérer les rapports de bugs soumis par les utilisateurs
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/settings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Paramètres
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Configuration générale de l'application
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="p-4 w-full flex items-stretch justify-between gap-4">
        <ChartTemplate
          chartData={chartData}
          chartConfig={chartConfig}
          className="flex-1"
        />
        <PieChartTemplate
          chartData={pieData}
          chartConfig={pieConfig}
          className="flex-1"
        />
        <BarChartTemplate
          chartData={barData}
          chartConfig={barConfig}
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
