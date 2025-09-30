"use client";

import { useState } from "react";
import { Trophy, Target, Zap, TrendingUp, TrendingDown } from "lucide-react";
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

interface MatchupPredictorProps {
  teams: TeamData[];
}

export default function MatchupPredictor({ teams }: MatchupPredictorProps) {
  const [selectedTeam1, setSelectedTeam1] = useState<string>("");
  const [selectedTeam2, setSelectedTeam2] = useState<string>("");
  const [prediction, setPrediction] = useState<any>(null);

  const predictMatchup = () => {
    if (!selectedTeam1 || !selectedTeam2) return;

    const team1 = teams.find(
      (t) => t.roster.roster_id.toString() === selectedTeam1
    );
    const team2 = teams.find(
      (t) => t.roster.roster_id.toString() === selectedTeam2
    );

    if (!team1 || !team2) return;

    // Calculate team strength based on multiple factors
    const team1Strength = calculateTeamStrength(team1);
    const team2Strength = calculateTeamStrength(team2);

    const totalStrength = team1Strength + team2Strength;
    const team1WinProbability = (team1Strength / totalStrength) * 100;
    const team2WinProbability = (team2Strength / totalStrength) * 100;

    // Determine favorite
    const favorite = team1Strength > team2Strength ? team1 : team2;
    const underdog = team1Strength > team2Strength ? team2 : team1;
    const spread = Math.abs(team1Strength - team2Strength) / 10; // Mock spread

    setPrediction({
      team1: team1,
      team2: team2,
      team1WinProbability: Math.round(team1WinProbability),
      team2WinProbability: Math.round(team2WinProbability),
      favorite,
      underdog,
      spread: Math.round(spread * 10) / 10,
      confidence: Math.abs(team1WinProbability - 50) * 2, // 0-100 confidence
    });
  };

  const calculateTeamStrength = (team: TeamData) => {
    // Multi-factor team strength calculation
    const winPct = team.wins / (team.wins + team.losses);
    const pointsPerGame = team.pointsFor / (team.wins + team.losses);
    const pointDiff = team.pointsFor - team.pointsAgainst;

    // Weighted formula: 40% win %, 35% PPG, 25% point differential
    const strength = winPct * 40 + pointsPerGame * 3.5 + pointDiff * 0.25;
    return Math.max(0, strength); // Ensure non-negative
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 60) return "text-green-600";
    if (confidence > 30) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 60) return "High Confidence";
    if (confidence > 30) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Matchup Predictor
        </CardTitle>
        <CardDescription>
          Predict the outcome of head-to-head matchups
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Team 1</label>
            <select
              value={selectedTeam1}
              onChange={(e) => setSelectedTeam1(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option
                  key={team.roster.roster_id}
                  value={team.roster.roster_id.toString()}
                >
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Team 2</label>
            <select
              value={selectedTeam2}
              onChange={(e) => setSelectedTeam2(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option
                  key={team.roster.roster_id}
                  value={team.roster.roster_id.toString()}
                >
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={predictMatchup}
          className="w-full"
          disabled={
            !selectedTeam1 || !selectedTeam2 || selectedTeam1 === selectedTeam2
          }
        >
          <Zap className="w-4 h-4 mr-2" />
          Predict Matchup
        </Button>

        {/* Prediction Results */}
        {prediction && (
          <div className="space-y-4">
            {/* Main Prediction */}
            <div className="p-6 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Prediction</h3>
                <Badge
                  variant="outline"
                  className={getConfidenceColor(prediction.confidence)}
                >
                  {getConfidenceLabel(prediction.confidence)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium">
                      {prediction.favorite.teamName}
                    </span>
                    <Badge variant="default">Favorite</Badge>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {prediction.favorite === prediction.team1
                      ? prediction.team1WinProbability
                      : prediction.team2WinProbability}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Win Probability
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">
                      {prediction.underdog.teamName}
                    </span>
                    <Badge variant="secondary">Underdog</Badge>
                  </div>
                  <div className="text-3xl font-bold text-muted-foreground">
                    {prediction.underdog === prediction.team1
                      ? prediction.team1WinProbability
                      : prediction.team2WinProbability}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Win Probability
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Projected spread:{" "}
                  <strong>
                    {prediction.favorite.teamName} by {prediction.spread} points
                  </strong>
                </p>
              </div>
            </div>

            {/* Team Stats Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {prediction.team1.teamName}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Record:</span>
                    <span>
                      {prediction.team1.wins}-{prediction.team1.losses}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points For:</span>
                    <span>{prediction.team1.pointsFor.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points Against:</span>
                    <span>{prediction.team1.pointsAgainst.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Point Differential:</span>
                    <span
                      className={
                        prediction.team1.pointsFor -
                          prediction.team1.pointsAgainst >
                        0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {(
                        prediction.team1.pointsFor -
                        prediction.team1.pointsAgainst
                      ).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  {prediction.team2.teamName}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Record:</span>
                    <span>
                      {prediction.team2.wins}-{prediction.team2.losses}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points For:</span>
                    <span>{prediction.team2.pointsFor.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points Against:</span>
                    <span>{prediction.team2.pointsAgainst.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Point Differential:</span>
                    <span
                      className={
                        prediction.team2.pointsFor -
                          prediction.team2.pointsAgainst >
                        0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {(
                        prediction.team2.pointsFor -
                        prediction.team2.pointsAgainst
                      ).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              * Predictions based on current season performance and statistical
              analysis
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
