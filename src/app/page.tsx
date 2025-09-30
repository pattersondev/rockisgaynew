"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Users,
  TrendingUp,
  Shuffle,
  Target,
  BarChart3,
  Zap,
  ArrowRightLeft,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamData } from "@/types/sleeper";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";

const LEAGUE_ID = "1180953029979762688";

export default function Home() {
  const [leagueData, setLeagueData] = useState<any>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        // Fetch league info
        const leagueResponse = await fetch(
          `https://api.sleeper.app/v1/league/${LEAGUE_ID}`
        );
        const league = await leagueResponse.json();

        // Fetch rosters
        const rostersResponse = await fetch(
          `https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`
        );
        const rosters = await rostersResponse.json();

        // Fetch users
        const usersResponse = await fetch(
          `https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`
        );
        const users = await usersResponse.json();

        // Combine data
        const teamsData: TeamData[] = rosters.map((roster: any) => {
          const user = users.find((u: any) => u.user_id === roster.owner_id);
          return {
            roster,
            user,
            teamName: user?.metadata?.team_name || "Unknown Team",
            ownerName: user?.display_name || "Unknown Owner",
            wins: roster.settings.wins,
            losses: roster.settings.losses,
            ties: roster.settings.ties,
            pointsFor:
              roster.settings.fpts + roster.settings.fpts_decimal / 100,
            pointsAgainst:
              roster.settings.fpts_against +
              roster.settings.fpts_against_decimal / 100,
            division: roster.settings.division,
            streak: roster.metadata.streak,
            record: roster.metadata.record,
          };
        });

        setLeagueData(league);
        setTeams(
          teamsData.sort((a, b) => b.wins - b.losses - (a.wins - a.losses))
        );
        setLoading(false);
      } catch (error) {
        console.error("Error fetching league data:", error);
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, []);

  const getPowerRanking = (team: TeamData) => {
    const winPct = team.wins / (team.wins + team.losses);
    const pointDiff = team.pointsFor - team.pointsAgainst;
    const powerScore = winPct * 100 + pointDiff / 10;
    return Math.round(powerScore);
  };

  const getDivisionName = (divisionNum: number) => {
    if (leagueData?.metadata) {
      return divisionNum === 1
        ? leagueData.metadata.division_1
        : leagueData.metadata.division_2;
    }
    return `Division ${divisionNum}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading league data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative">
                <Image
                  src="/favicon.ico"
                  alt="League Logo"
                  width={40}
                  height={40}
                  className="rounded-lg md:w-12 md:h-12"
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-foreground truncate">
                  {leagueData?.name || "Fantasy League"}
                </h1>
              </div>
            </div>

            {/* Navigation and Controls */}
            <div className="flex items-center gap-2 md:gap-4">
              <Navigation />

              {/* League Info Badges */}
              <div className="hidden sm:flex items-center gap-2 md:gap-4">
                <Badge variant="secondary" className="text-xs md:text-sm">
                  <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  {leagueData?.settings?.num_teams || 12} Teams
                </Badge>
                <Badge variant="outline" className="text-xs md:text-sm">
                  <Users className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  {leagueData?.settings?.divisions || 2} Divisions
                </Badge>
              </div>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Points
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teams
                  .reduce((sum, team) => sum + team.pointsFor, 0)
                  .toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                League total this season
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Highest Scorer
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(...teams.map((t) => t.pointsFor)).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {
                  teams.find(
                    (t) =>
                      t.pointsFor === Math.max(...teams.map((t) => t.pointsFor))
                  )?.teamName
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Record</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(...teams.map((t) => t.wins))}-
                {Math.min(...teams.map((t) => t.losses))}
              </div>
              <p className="text-xs text-muted-foreground">
                {
                  teams.find(
                    (t) => t.wins === Math.max(...teams.map((t) => t.wins))
                  )?.teamName
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                League Champion
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teams.sort(
                  (a, b) => getPowerRanking(b) - getPowerRanking(a)
                )[0]?.teamName || "TBD"}
              </div>
              <p className="text-xs text-muted-foreground">Current favorite</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Divisions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {[1, 2].map((divisionNum) => (
            <Card key={divisionNum}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {getDivisionName(divisionNum)}
                </CardTitle>
                <CardDescription>Current division standings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teams
                    .filter((team) => team.division === divisionNum)
                    .sort((a, b) => b.wins - b.losses - (a.wins - a.losses))
                    .map((team, index) => (
                      <div
                        key={team.roster.roster_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{team.teamName}</p>
                            <p className="text-sm text-muted-foreground">
                              {team.ownerName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {team.wins}-{team.losses}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {team.pointsFor.toFixed(1)} PF
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access to Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              League Tools
            </CardTitle>
            <CardDescription>
              Explore advanced analytics and league management tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link href="/predictions" className="group">
                <div className="p-4 border rounded-lg hover:bg-muted transition-colors text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-sm font-medium">Predictions</p>
                </div>
              </Link>
              <Link href="/shuffle" className="group">
                <div className="p-4 border rounded-lg hover:bg-muted transition-colors text-center">
                  <Shuffle className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium">Shuffle</p>
                </div>
              </Link>
              <Link href="/matchups" className="group">
                <div className="p-4 border rounded-lg hover:bg-muted transition-colors text-center">
                  <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium">Matchups</p>
                </div>
              </Link>
              <Link href="/luck" className="group">
                <div className="p-4 border rounded-lg hover:bg-muted transition-colors text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm font-medium">Luck Index</p>
                </div>
              </Link>
              <Link href="/rankings" className="group">
                <div className="p-4 border rounded-lg hover:bg-muted transition-colors text-center">
                  <BarChart3 className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <p className="text-sm font-medium">Rankings</p>
                </div>
              </Link>
              <Link href="/draft" className="group">
                <div className="p-4 border rounded-lg hover:bg-muted transition-colors text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
                  <p className="text-sm font-medium">Draft Analysis</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
