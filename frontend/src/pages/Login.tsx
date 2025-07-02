import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, User, Building2 } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "user",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (
    e: React.FormEvent,
    role: "user" | "recruiter"
  ) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous error messages

    // Validate fields before sending
    if (!formData.email || !formData.password || !role) {
      setErrorMessage("Please enter email, password, and select a role.");
      return;
    }
    if (role !== "user" && role !== "recruiter") {
      setErrorMessage("Invalid role selected.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: formData.email,
        password: formData.password,
        role: role,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userName", user.fullName || "User");
      localStorage.setItem("isLoggedIn", "true");

      // Redirect
      window.location.href =
        role === "recruiter" ? "/recruiter-dashboard" : "/user-dashboard";
    } catch (err: Error | unknown) {
      if (err instanceof Error && axios.isAxiosError(err) && err.response) {
        if (err.response.status === 400 || err.response.status === 401) {
          setErrorMessage(err.response.data?.msg || "Invalid credentials");
        } else {
          setErrorMessage("Server error. Please try again later.");
        }
      } else {
        setErrorMessage("Invalid credentials");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AVIRI
              </span>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          <Card className="border-gray-200 shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center justify-center text-blue-800">
                <LogIn className="w-5 h-5 mr-2 text-blue-600" />
                Sign In
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs
                defaultValue="user"
                className="w-full"
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                  <TabsTrigger
                    value="user"
                    className="flex items-center data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Job Seeker
                  </TabsTrigger>
                  <TabsTrigger
                    value="recruiter"
                    className="flex items-center data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Recruiter
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="user">
                  <form
                    onSubmit={(e) => handleSubmit(e, "user")}
                    className="space-y-6"
                  >
                    {errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                        {errorMessage}
                      </div>
                    )}
                    
                    <div>
                      <Label
                        htmlFor="user-email"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Email address
                      </Label>
                      <Input
                        id="user-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        required
                        className="mt-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="user-password"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Password
                      </Label>
                      <Input
                        id="user-password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        required
                        className="mt-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
                    >
                      Sign in as Job Seeker
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="recruiter">
                  <form
                    onSubmit={(e) => handleSubmit(e, "recruiter")}
                    className="space-y-6"
                  >
                    {errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                        {errorMessage}
                      </div>
                    )}
                    
                    <div>
                      <Label
                        htmlFor="recruiter-email"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Email address
                      </Label>
                      <Input
                        id="recruiter-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        required
                        className="mt-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="recruiter-password"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Password
                      </Label>
                      <Input
                        id="recruiter-password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        required
                        className="mt-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
                    >
                      Sign in as Recruiter
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
