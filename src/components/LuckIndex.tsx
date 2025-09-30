"use client";

import {
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamData } from "@/types/sleeper";

interface LuckIndexProps {
  teams: TeamData[];
}

export default function LuckIndex({ teams }: LuckIndexProps) {
  const calculateExpectedRecord = (team: TeamData) => {
    // Calculate expected wins based on points for vs points against ratio
    // This is a more accurate method than using league averages

    const gamesPlayed = team.wins + team.losses;
    if (gamesPlayed === 0) return 0;

    // Pythagorean expectation: Expected Win% = (PF^2) / (PF^2 + PA^2)
    const pythagoreanWinPct =
      (team.pointsFor * team.pointsFor) /
      (team.pointsFor * team.pointsFor +
        team.pointsAgainst * team.pointsAgainst);

    const expectedWins = pythagoreanWinPct * gamesPlayed;
    return Math.round(expectedWins * 10) / 10;
  };

  const calculateLuckScore = (team: TeamData) => {
    const expectedWins = calculateExpectedRecord(team);
    const actualWins = team.wins;
    const luckScore = actualWins - expectedWins;
    return Math.round(luckScore * 10) / 10;
  };

  const getLuckCategory = (luckScore: number) => {
    // More realistic thresholds for fantasy football luck
    if (luckScore > 1.5)
      return {
        label: "Very Lucky",
        color: "text-green-600",
        variant: "default" as const,
      };
    if (luckScore > 0.8)
      return {
        label: "Lucky",
        color: "text-green-500",
        variant: "secondary" as const,
      };
    if (luckScore < -1.5)
      return {
        label: "Very Unlucky",
        color: "text-red-600",
        variant: "destructive" as const,
      };
    if (luckScore < -0.8)
      return {
        label: "Unlucky",
        color: "text-orange-500",
        variant: "outline" as const,
      };
    return {
      label: "Neutral",
      color: "text-gray-500",
      variant: "outline" as const,
    };
  };

  const sortedTeams = [...teams].sort(
    (a, b) => calculateLuckScore(b) - calculateLuckScore(a)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Luck Index
        </CardTitle>
        <CardDescription>
          Teams ranked by how lucky/unlucky they've been based on their record
          vs expected record
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTeams.map((team, index) => {
            const luckScore = calculateLuckScore(team);
            const expectedWins = calculateExpectedRecord(team);
            const luckCategory = getLuckCategory(luckScore);

            return (
              <div
                key={team.roster.roster_id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {luckScore > 0.5 ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : luckScore < -0.5 ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-500" />
                    )}
                    <Badge
                      variant={luckCategory.variant}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    >
                      {index + 1}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium text-lg">{team.teamName}</p>
                    <p className="text-sm text-muted-foreground">
                      {team.ownerName} • {team.wins}-{team.losses} Record
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={luckCategory.variant}>
                      {luckCategory.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Actual: {team.wins} wins</p>
                    <p>Expected: {expectedWins} wins</p>
                    <p className={`font-medium ${luckCategory.color}`}>
                      {luckScore > 0 ? "+" : ""}
                      {luckScore} luck
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium mb-2">How Luck Index Works</h4>
              <p className="text-sm text-muted-foreground mb-2">
                The Luck Index compares each team's actual record to their
                expected record based on points scored vs league average.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • <strong>Lucky teams</strong> have more wins than their
                  points suggest they should
                </li>
                <li>
                  • <strong>Unlucky teams</strong> have fewer wins than their
                  points suggest they should
                </li>
                <li>
                  • <strong>Neutral teams</strong> have records that match their
                  point production
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
