import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, FileText, Gamepad2, Verified, Star, Crown, UserPlus, Plus } from "lucide-react";
import type { SearchResults, UserWithFriendCount, GroupWithCreator, PageWithCreator, Game } from "@shared/schema";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Search results query
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to search");
      return response.json() as Promise<SearchResults>;
    },
    enabled: !!searchQuery.trim(),
  });

  // Top/Featured content queries
  const { data: topUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return [];
      return response.json() as Promise<UserWithFriendCount[]>;
    },
  });

  const { data: topGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const response = await fetch("/api/groups", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return [];
      return response.json() as Promise<GroupWithCreator[]>;
    },
  });

  const { data: topPages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["/api/pages"],
    queryFn: async () => {
      const response = await fetch("/api/pages", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return [];
      return response.json() as Promise<PageWithCreator[]>;
    },
  });

  const { data: topGames = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games"],
    queryFn: async () => {
      const response = await fetch("/api/games", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return [];
      return response.json() as Promise<Game[]>;
    },
  });

  const LoadingSkeleton = ({ count = 6 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array(count).fill(0).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const UserCard = ({ user }: { user: UserWithFriendCount }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profilePhoto || ""} alt={user.username} />
            <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{user.firstName} {user.lastName}</h3>
              {user.isAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
            </div>
            <p className="text-sm text-gray-500 truncate">@{user.username}</p>
            {user.work && <p className="text-xs text-gray-400 truncate">{user.work}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {user.friendsCount || 0} friends
          </Badge>
          <Button size="sm" variant="outline">
            <UserPlus className="h-4 w-4 mr-1" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const GroupCard = ({ group }: { group: GroupWithCreator }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 relative">
        {group.coverPhoto ? (
          <img src={group.coverPhoto} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <Users className="h-12 w-12" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1 truncate">{group.name}</h3>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{group.description}</p>
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="text-xs">
            {group.membersCount} members
          </Badge>
          <div className="flex items-center space-x-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={group.creator.profilePhoto || ""} alt={group.creator.username} />
              <AvatarFallback className="text-xs">{group.creator.firstName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-400">by {group.creator.firstName}</span>
          </div>
        </div>
        <Button size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-1" />
          Join Group
        </Button>
      </CardContent>
    </Card>
  );

  const PageCard = ({ page }: { page: PageWithCreator }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gradient-to-r from-green-500 to-teal-600 relative">
        {page.coverPhoto ? (
          <img src={page.coverPhoto} alt={page.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <FileText className="h-12 w-12" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold truncate">{page.name}</h3>
          {page.isVerified && <Verified className="h-4 w-4 text-blue-500" />}
        </div>
        <Badge variant="outline" className="text-xs mb-2 capitalize">{page.category}</Badge>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{page.description}</p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {page.followersCount} followers
          </Badge>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Follow
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const GameCard = ({ game }: { game: Game }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gradient-to-r from-purple-500 to-pink-600 relative">
        {game.thumbnailUrl ? (
          <img src={game.thumbnailUrl} alt={game.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <Gamepad2 className="h-12 w-12" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1 truncate">{game.name}</h3>
        <Badge variant="outline" className="text-xs mb-2 capitalize">{game.category}</Badge>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{game.description}</p>
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="text-xs">
            {game.playersCount} players
          </Badge>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">{game.rating}/5</span>
          </div>
        </div>
        <Button size="sm" className="w-full">
          Play Now
        </Button>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    if (searchQuery.trim()) {
      if (searchLoading) {
        return <LoadingSkeleton count={4} />;
      }

      if (!searchResults) {
        return (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Enter a search query to find people, groups, pages, and games</p>
          </div>
        );
      }

      const { users, groups, pages, games } = searchResults;
      const totalResults = users.length + groups.length + pages.length + games.length;

      if (totalResults === 0) {
        return (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No results found for "{searchQuery}"</p>
          </div>
        );
      }

      return (
        <div className="space-y-8">
          {users.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">People ({users.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => <UserCard key={user.id} user={user} />)}
              </div>
            </div>
          )}

          {groups.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Groups ({groups.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map(group => <GroupCard key={group.id} group={group} />)}
              </div>
            </div>
          )}

          {pages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Pages ({pages.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map(page => <PageCard key={page.id} page={page} />)}
              </div>
            </div>
          )}

          {games.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Games ({games.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map(game => <GameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Show top content when not searching
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Top People</h3>
            {usersLoading ? <LoadingSkeleton count={3} /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topUsers.slice(0, 6).map(user => <UserCard key={user.id} user={user} />)}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Popular Groups</h3>
            {groupsLoading ? <LoadingSkeleton count={3} /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topGroups.slice(0, 6).map(group => <GroupCard key={group.id} group={group} />)}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Featured Pages</h3>
            {pagesLoading ? <LoadingSkeleton count={3} /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topPages.slice(0, 6).map(page => <PageCard key={page.id} page={page} />)}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Popular Games</h3>
            {gamesLoading ? <LoadingSkeleton count={3} /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topGames.slice(0, 6).map(game => <GameCard key={game.id} game={game} />)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="people">
          {usersLoading ? <LoadingSkeleton count={9} /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topUsers.map(user => <UserCard key={user.id} user={user} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups">
          {groupsLoading ? <LoadingSkeleton count={9} /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topGroups.map(group => <GroupCard key={group.id} group={group} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pages">
          {pagesLoading ? <LoadingSkeleton count={9} /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPages.map(page => <PageCard key={page.id} page={page} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="games">
          {gamesLoading ? <LoadingSkeleton count={9} /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topGames.map(game => <GameCard key={game.id} game={game} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto p-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Discover</CardTitle>
              <CardDescription>Find and connect with people, groups, pages, and games</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search for people, groups, pages, or games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              {renderResults()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}