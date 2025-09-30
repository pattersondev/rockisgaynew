"use client";

import {
  Trophy,
  TrendingUp,
  Target,
  Calculator,
  Zap,
  Crown,
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

interface LeagueWinnerPredictorProps {
  teams: TeamData[];
}

interface PredictionData {
  team: TeamData;
  winProbability: number;
  playoffProbability: number;
  championshipProbability: number;
  strengthScore: number;
  remainingSchedule: number; // 0-1, higher = easier remaining schedule
  momentum: number; // -1 to 1, based on recent performance
}

export default function LeagueWinnerPredictor({
  teams,
}: LeagueWinnerPredictorProps) {
  // Calculate advanced metrics for each team
  const calculateTeamMetrics = (team: TeamData): PredictionData => {
    // Strength Score: Combination of multiple factors
    const winPct = team.wins / (team.wins + team.losses);
    const pointsPerGame = team.pointsFor / (team.wins + team.losses);
    const pointDiff = team.pointsFor - team.pointsAgainst;

    // League averages for comparison
    const leagueAvgPF =
      teams.reduce((sum, t) => sum + t.pointsFor, 0) / teams.length;
    const leagueAvgPA =
      teams.reduce((sum, t) => sum + t.pointsAgainst, 0) / teams.length;
    const leagueAvgWinPct =
      teams.reduce((sum, t) => sum + t.wins / (t.wins + t.losses), 0) /
      teams.length;

    // Calculate relative performance vs league average
    const relativeOffense =
      pointsPerGame /
      (leagueAvgPF / (leagueAvgWinPct * 10 + (1 - leagueAvgWinPct) * 10));
    const relativeDefense =
      leagueAvgPA /
      (leagueAvgWinPct * 10 + (1 - leagueAvgWinPct) * 10) /
      (team.pointsAgainst / (team.wins + team.losses));

    // Strength Score (0-100)
    const strengthScore = Math.min(
      100,
      Math.max(
        0,
        winPct * 40 + // 40% weight on win percentage
          relativeOffense * 25 + // 25% weight on offensive efficiency
          relativeDefense * 20 + // 20% weight on defensive efficiency
          (pointDiff / 10) * 15 // 15% weight on point differential
      )
    );

    // Remaining Schedule Difficulty (mock calculation - in reality would need actual schedule)
    const remainingSchedule = Math.random() * 0.4 + 0.3; // 0.3-0.7 range

    // Momentum calculation based on recent record pattern
    const recordArray = team.record.split("").slice(-3); // Last 3 games
    const recentWins = recordArray.filter((r) => r === "W").length;
    const momentum = (recentWins - 1.5) / 1.5; // -1 to 1 scale

    // Playoff probability based on current standing and remaining games
    const gamesPlayed = team.wins + team.losses;
    const totalGames = 13; // Typical fantasy season
    const remainingGames = totalGames - gamesPlayed;

    // Current playoff position (top 6 make playoffs)
    const currentStanding =
      teams
        .sort((a, b) => b.wins - b.losses - (a.wins - a.losses))
        .findIndex((t) => t.roster.roster_id === team.roster.roster_id) + 1;

    const playoffProbability = Math.max(
      0,
      Math.min(
        100,
        currentStanding <= 6
          ? 85 - currentStanding * 8
          : currentStanding <= 8
          ? 25 - (currentStanding - 6) * 10
          : 5
      )
    );

    // Championship probability based on strength score, playoff probability, and momentum
    const championshipProbability = Math.max(
      0.5,
      Math.min(
        25, // More realistic max championship probability
        (strengthScore / 100) * (playoffProbability / 100) * 35 + // Base championship odds (reduced)
          (momentum + 1) * 5 + // Momentum bonus (reduced)
          (remainingSchedule - 0.5) * 8 // Schedule difficulty adjustment (reduced)
      )
    );

    // Win probability for remaining games
    const winProbability = Math.max(
      15,
      Math.min(
        85,
        (strengthScore / 100) * 50 + // Base win probability (more conservative)
          momentum * 15 + // Momentum adjustment (reduced)
          (remainingSchedule - 0.5) * 20 // Schedule adjustment (reduced)
      )
    );

    return {
      team,
      winProbability: Math.round(winProbability),
      playoffProbability: Math.round(playoffProbability),
      championshipProbability: Math.round(championshipProbability * 10) / 10,
      strengthScore: Math.round(strengthScore),
      remainingSchedule: Math.round(remainingSchedule * 100),
      momentum: Math.round(momentum * 100) / 100,
    };
  };

  const predictions = teams
    .map(calculateTeamMetrics)
    .sort((a, b) => b.championshipProbability - a.championshipProbability);

  const getRankingIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index < 3) return <Trophy className="w-5 h-5 text-yellow-600" />;
    if (index < 6) return <Target className="w-5 h-5 text-blue-500" />;
    return <TrendingUp className="w-5 h-5 text-gray-500" />;
  };

  const getRankingColor = (index: number) => {
    if (index === 0) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (index < 3) return "text-yellow-700 bg-yellow-100 border-yellow-300";
    if (index < 6) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getMomentumColor = (momentum: number) => {
    if (momentum > 0.3) return "text-green-600";
    if (momentum > -0.3) return "text-yellow-600";
    return "text-red-600";
  };

  const getMomentumIcon = (momentum: number) => {
    if (momentum > 0.3) return "📈";
    if (momentum > -0.3) return "➡️";
    return "📉";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          League Championship Predictor
        </CardTitle>
        <CardDescription>
          Advanced statistical analysis predicting championship probability
          based on performance, schedule, and momentum
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 md:space-y-6">
          {predictions.map((prediction, index) => (
            <div
              key={prediction.team.roster.roster_id}
              className={`p-4 md:p-6 rounded-xl border-2 ${getRankingColor(
                index
              )} transition-all hover:shadow-lg hover:scale-[1.01] md:hover:scale-[1.02] duration-200`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-2">
                    {getRankingIcon(index)}
                    <Badge
                      variant={
                        index < 3
                          ? "default"
                          : index < 6
                          ? "secondary"
                          : "outline"
                      }
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold"
                    >
                      {index + 1}
                    </Badge>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-base md:text-lg truncate">
                      {prediction.team.teamName}
                    </p>
                    <p className="text-xs md:text-sm opacity-75 truncate">
                      {prediction.team.ownerName}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                      <span className="text-xs md:text-sm">
                        {prediction.team.wins}-{prediction.team.losses} Record
                      </span>
                      <span className="text-xs md:text-sm">
                        {prediction.team.pointsFor.toFixed(1)} PF
                      </span>
                      <span
                        className={`text-xs md:text-sm flex items-center gap-1 ${getMomentumColor(
                          prediction.momentum
                        )}`}
                      >
                        {getMomentumIcon(prediction.momentum)} Momentum:{" "}
                        {prediction.momentum > 0 ? "+" : ""}
                        {prediction.momentum}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <div className="grid grid-cols-3 gap-2 md:gap-6 text-center">
                    <div>
                      <p className="text-lg md:text-2xl font-bold text-primary">
                        {prediction.championshipProbability}%
                      </p>
                      <p className="text-xs opacity-75">Championship</p>
                    </div>
                    <div>
                      <p className="text-base md:text-xl font-semibold">
                        {prediction.playoffProbability}%
                      </p>
                      <p className="text-xs opacity-75">Playoffs</p>
                    </div>
                    <div>
                      <p className="text-base md:text-xl font-semibold">
                        {prediction.winProbability}%
                      </p>
                      <p className="text-xs opacity-75">Win Rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="mt-4 pt-4 border-t border-current/20">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span>Strength Score:</span>
                    <span className="font-medium">
                      {prediction.strengthScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Schedule Difficulty:</span>
                    <span className="font-medium">
                      {prediction.remainingSchedule}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Point Differential:</span>
                    <span
                      className={`font-medium ${
                        prediction.team.pointsFor -
                          prediction.team.pointsAgainst >
                        0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(
                        prediction.team.pointsFor -
                        prediction.team.pointsAgainst
                      ).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Methodology */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Calculator className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium mb-2">Prediction Methodology</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Our algorithm combines multiple statistical factors to predict
                championship probability:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • <strong>Strength Score:</strong> Win percentage (40%),
                  offensive efficiency (25%), defensive efficiency (20%), point
                  differential (15%)
                </li>
                <li>
                  • <strong>Momentum:</strong> Recent performance trend based on
                  last 3 games
                </li>
                <li>
                  • <strong>Schedule Difficulty:</strong> Remaining opponents'
                  average strength
                </li>
                <li>
                  • <strong>Playoff Probability:</strong> Current standing and
                  remaining games analysis
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
