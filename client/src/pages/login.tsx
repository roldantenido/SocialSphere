
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, insertUserSchema, type LoginCredentials, type InsertUser } from "@shared/schema";
import { authStorage } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
      firstName: "",
      lastName: "",
      bio: "",
      profilePhoto: "",
      coverPhoto: "",
      location: "",
      work: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginCredentials) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      authStorage.setSessionId(data.sessionId);
      authStorage.setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Success", description: "Logged in successfully!" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      authStorage.setSessionId(data.sessionId);
      authStorage.setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Success", description: "Account created successfully!" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const onLoginSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  const onSignUpSubmit = (data: InsertUser) => {
    signUpMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-4xl font-bold text-primary mb-2">SocialConnect</CardTitle>
              <CardDescription className="text-lg">
                {isSignUp ? "Create your account and join the community" : "Welcome back! Sign in to your account"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isSignUp ? (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Email or Phone" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="password" placeholder="Password" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Log In"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={signUpForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="First Name" {...field} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signUpForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Last Name" {...field} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={signUpForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Username" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Email" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="password" placeholder="Password" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg" 
                      disabled={signUpMutation.isPending}
                    >
                      {signUpMutation.isPending ? "Creating Account..." : "Sign Up"}
                    </Button>
                  </form>
                </Form>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full h-12" type="button">
                  <i className="fab fa-facebook-f text-blue-600 mr-2"></i>
                  Facebook
                </Button>
                <Button variant="outline" className="w-full h-12" type="button">
                  <i className="fab fa-google text-red-500 mr-2"></i>
                  Google
                </Button>
              </div>

              <div className="text-center">
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:text-primary/80 font-medium text-lg"
                >
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Background Image with Content */}
      <div className="flex-1 bg-gradient-to-br from-primary via-blue-600 to-purple-700 flex items-center justify-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-32 left-40 w-28 h-28 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-36 h-36 bg-white rounded-full"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-lg">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-share-alt text-primary text-3xl"></i>
            </div>
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Connect, Share & 
              <span className="text-yellow-300"> Automate</span>
            </h2>
            <p className="text-xl leading-relaxed mb-8 opacity-90">
              Streamline your social presence by connecting with friends, sharing memorable moments, 
              and automatically syncing your content across all your social media platforms. 
              Experience seamless social networking like never before.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-users text-2xl"></i>
              </div>
              <p className="text-sm font-medium">Connect with Friends</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-camera text-2xl"></i>
              </div>
              <p className="text-sm font-medium">Share Moments</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-sync-alt text-2xl"></i>
              </div>
              <p className="text-sm font-medium">Auto-Sync Content</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-4 text-sm opacity-75">
            <i className="fab fa-facebook text-2xl"></i>
            <i className="fab fa-twitter text-2xl"></i>
            <i className="fab fa-instagram text-2xl"></i>
            <i className="fab fa-linkedin text-2xl"></i>
            <i className="fab fa-youtube text-2xl"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
