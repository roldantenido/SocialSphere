import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Groups() {
  // Mock data for demonstration
  const userGroups = [
    {
      id: 1,
      name: "Photography Enthusiasts",
      memberCount: 1245,
      coverImage: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=200&fit=crop",
    },
    {
      id: 2,
      name: "Local Fitness Group",
      memberCount: 567,
      coverImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop",
    },
  ];

  const suggestedGroups = [
    {
      id: 3,
      name: "Digital Art Community",
      memberCount: 2134,
      coverImage: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=200&fit=crop",
    },
    {
      id: 4,
      name: "Book Lovers Club",
      memberCount: 892,
      coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto p-4">
          <Card className="p-6 mb-6">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
              <CardTitle className="text-2xl">Groups</CardTitle>
              <Button>Create Group</Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {/* Your Groups */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Groups</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userGroups.map((group) => (
                    <Card key={group.id} className="bg-gray-50 overflow-hidden">
                      <img 
                        src={group.coverImage} 
                        alt={group.name}
                        className="w-full h-32 object-cover"
                      />
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{group.name}</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          {group.memberCount.toLocaleString()} members
                        </p>
                        <Button className="w-full">View Group</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Suggested Groups */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Groups</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedGroups.map((group) => (
                    <Card key={group.id} className="bg-gray-50 overflow-hidden">
                      <img 
                        src={group.coverImage} 
                        alt={group.name}
                        className="w-full h-32 object-cover"
                      />
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{group.name}</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          {group.memberCount.toLocaleString()} members
                        </p>
                        <Button className="w-full">Join Group</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
