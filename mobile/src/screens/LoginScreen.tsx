import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../services/auth";

export function LoginScreen({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Hold up", "Enter your username and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (error: any) {
      Alert.alert("Login failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>Touch Grass</Text>
        <Text style={styles.tagline}>Go outside. Earn points.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? "Logging in..." : "Log In"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onSwitchToSignUp} style={styles.switchLink}>
          <Text style={styles.switchText}>
            Don't have an account? <Text style={styles.switchBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  form: { gap: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  switchLink: { marginTop: 24, alignItems: "center" },
  switchText: { fontSize: 14, color: "#888" },
  switchBold: { color: "#4CAF50", fontWeight: "bold" },
});
