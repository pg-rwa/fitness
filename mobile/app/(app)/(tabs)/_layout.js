import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../contexts/AuthContext";

export default function TabsLayout() {
  const { user } = useAuth();
  const isTrainer = user?.role === "trainer" || user?.role === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#2A2A3E", borderTopColor: "#3A3A4E", height: 85, paddingBottom: 20, paddingTop: 8 },
        tabBarActiveTintColor: "#E8614D",
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Nutrition",
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isTrainer ? "Trainer" : "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isTrainer ? "people" : "person"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
