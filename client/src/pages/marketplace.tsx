import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState("All Items");

  const categories = ["All Items", "Electronics", "Furniture", "Clothing", "Cars"];

  // Mock marketplace items
  const marketplaceItems = [
    {
      id: 1,
      title: "Wireless Headphones",
      price: 89,
      location: "New York, NY",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop",
    },
    {
      id: 2,
      title: "Modern Sofa",
      price: 450,
      location: "Brooklyn, NY",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop",
    },
    {
      id: 3,
      title: "Gaming Laptop",
      price: 1200,
      location: "Manhattan, NY",
      image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&h=200&fit=crop",
    },
    {
      id: 4,
      title: "Vintage Camera",
      price: 320,
      location: "Queens, NY",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=200&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto p-4">
          <Card className="p-6">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
              <CardTitle className="text-2xl">Marketplace</CardTitle>
              <Button>Sell Something</Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {/* Categories */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="rounded-full"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Marketplace Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {marketplaceItems.map((item) => (
                  <Card key={item.id} className="bg-gray-50 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-40 object-cover"
                    />
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-lg font-bold text-primary mb-2">${item.price}</p>
                      <p className="text-sm text-gray-500">{item.location}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
