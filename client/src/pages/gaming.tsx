import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Gaming() {
  const gameStats = [
    { label: "Games Played", value: 127 },
    { label: "High Score", value: 89 },
    { label: "Achievements", value: 23 },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto p-4">
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl">Gaming</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {/* Featured Games */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Games</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
                    <h4 className="text-xl font-bold mb-2">Word Quest</h4>
                    <p className="mb-4">Challenge your vocabulary skills!</p>
                    <Button variant="secondary">Play Now</Button>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
                    <h4 className="text-xl font-bold mb-2">Math Challenge</h4>
                    <p className="mb-4">Test your mathematical prowess!</p>
                    <Button variant="secondary">Play Now</Button>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-6 text-white">
                    <h4 className="text-xl font-bold mb-2">Memory Game</h4>
                    <p className="mb-4">Enhance your memory skills!</p>
                    <Button variant="secondary">Play Now</Button>
                  </div>
                </div>
              </div>

              {/* Gaming Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Gaming Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gameStats.map((stat) => (
                    <Card key={stat.label} className="bg-gray-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                        <p className="text-gray-600">{stat.label}</p>
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
