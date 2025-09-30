"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Trophy, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamData } from "@/types/sleeper";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import LeagueWinnerPredictor from "@/components/LeagueWinnerPredictor";

const LEAGUE_ID = "1180953029979762688";

export default function PredictionsPage() {
  const [leagueData, setLeagueData] = useState<any>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        const leagueResponse = await fetch(
          `https://api.sleeper.app/v1/league/${LEAGUE_ID}`
        );
        const league = await leagueResponse.json();

        const rostersResponse = await fetch(
          `https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`
        );
        const rosters = await rostersResponse.json();

        const usersResponse = await fetch(
          `https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`
        );
        const users = await usersResponse.json();

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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
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
                <h1 className="text-xl md:text-3xl font-bold text-foreground">
                  Championship Predictions
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Navigation />
              <div className="hidden sm:flex items-center gap-2 md:gap-4">
                <Badge variant="secondary" className="text-xs md:text-sm">
                  <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  {leagueData?.settings?.num_teams} Teams
                </Badge>
                <Badge variant="outline" className="text-xs md:text-sm">
                  <Users className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  {leagueData?.settings?.divisions} Divisions
                </Badge>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <LeagueWinnerPredictor teams={teams} />
      </main>
    </div>
  );
}
