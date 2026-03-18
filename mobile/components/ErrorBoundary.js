import { Component } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-dark items-center justify-center px-8">
          <View className="bg-red-500/20 rounded-full p-4 mb-4">
            <Ionicons name="warning" size={48} color="#EF4444" />
          </View>
          <Text className="text-white text-xl font-bold text-center mb-2">Something went wrong</Text>
          <Text className="text-gray-400 text-center mb-6">
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            className="bg-primary rounded-xl py-3.5 px-8"
            activeOpacity={0.7}
          >
            <Text className="text-white font-semibold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
