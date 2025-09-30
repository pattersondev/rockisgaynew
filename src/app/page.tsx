"use client";

import { useState, useEffect } from "react";
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
import LeagueWinnerPredictor from "@/components/LeagueWinnerPredictor";
import DivisionShuffler from "@/components/DivisionShuffler";
import ThemeToggle from "@/components/ThemeToggle";
import LuckIndex from "@/components/LuckIndex";
import MatchupPredictor from "@/components/MatchupPredictor";

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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {leagueData?.name}
              </h1>
              <p className="text-muted-foreground">
                Fantasy Football League Dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                <Trophy className="w-4 h-4 mr-1" />
                {leagueData?.settings?.num_teams} Teams
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Users className="w-4 h-4 mr-1" />
                {leagueData?.settings?.divisions} Divisions
              </Badge>
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

        {/* Division Shuffler */}
        <DivisionShuffler
          teams={teams}
          originalDivisions={{
            division1: teams.filter((team) => team.division === 1),
            division2: teams.filter((team) => team.division === 2),
          }}
          divisionNames={{
            division1: getDivisionName(1),
            division2: getDivisionName(2),
          }}
        />

        {/* Power Rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Power Rankings
            </CardTitle>
            <CardDescription>
              Based on win percentage and point differential
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teams
                .sort((a, b) => getPowerRanking(b) - getPowerRanking(a))
                .map((team, index) => (
                  <div
                    key={team.roster.roster_id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={index < 3 ? "default" : "secondary"}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                      >
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-lg">{team.teamName}</p>
                        <p className="text-sm text-muted-foreground">
                          {team.ownerName} • {team.wins}-{team.losses} •{" "}
                          {team.pointsFor.toFixed(1)} PF
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {getPowerRanking(team)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Power Score
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* League Winner Predictor */}
        <LeagueWinnerPredictor teams={teams} />

        {/* Advanced Tools Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Advanced League Tools
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LuckIndex teams={teams} />
            <MatchupPredictor teams={teams} />
          </div>
        </div>
      </main>
    </div>
  );
}
