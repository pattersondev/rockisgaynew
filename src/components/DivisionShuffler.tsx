"use client";

import { useState } from "react";
import {
  Shuffle,
  RotateCcw,
  Save,
  Target,
  TrendingUp,
  Users,
  Zap,
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

interface DivisionShufflerProps {
  teams: TeamData[];
  originalDivisions: { division1: TeamData[]; division2: TeamData[] };
  divisionNames: { division1: string; division2: string };
}

interface ShuffleResult {
  division1: TeamData[];
  division2: TeamData[];
  balanceScore: number;
  strengthVariance: number;
  rivalryScore: number;
}

export default function DivisionShuffler({
  teams,
  originalDivisions,
  divisionNames,
}: DivisionShufflerProps) {
  const [shuffledDivisions, setShuffledDivisions] =
    useState<ShuffleResult | null>(null);
  const [shuffleHistory, setShuffleHistory] = useState<ShuffleResult[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  const calculateTeamStrength = (team: TeamData) => {
    const winPct = team.wins / (team.wins + team.losses);
    const pointsPerGame = team.pointsFor / (team.wins + team.losses);
    const pointDiff = team.pointsFor - team.pointsAgainst;

    // More balanced strength calculation
    return winPct * 50 + pointsPerGame * 2 + pointDiff * 0.1;
  };

  const calculateDivisionBalance = (division: TeamData[]) => {
    if (division.length === 0) return 0;

    const strengths = division.map(calculateTeamStrength);
    const avgStrength =
      strengths.reduce((sum, str) => sum + str, 0) / strengths.length;

    // Calculate coefficient of variation (CV) for better normalization
    const standardDeviation = Math.sqrt(
      strengths.reduce((sum, str) => sum + Math.pow(str - avgStrength, 2), 0) /
        strengths.length
    );

    // Use coefficient of variation (std dev / mean) for better balance measurement
    const coefficientOfVariation =
      avgStrength > 0 ? standardDeviation / avgStrength : 0;

    // Convert CV to balance score (lower CV = better balance)
    // CV typically ranges from 0 to 1, map to 0-100 scale
    const balanceScore = Math.max(
      0,
      Math.min(100, (1 - coefficientOfVariation) * 100)
    );

    return Math.round(balanceScore);
  };

  const calculateRivalryScore = (division: TeamData[]) => {
    // Calculate potential for exciting matchups based on similar strength teams
    const strengths = division.map(calculateTeamStrength).sort((a, b) => b - a);
    let rivalryScore = 0;

    for (let i = 0; i < strengths.length - 1; i++) {
      const diff = Math.abs(strengths[i] - strengths[i + 1]);
      if (diff < 5) rivalryScore += 20; // Close strength = good rivalry
      if (diff < 10) rivalryScore += 10;
    }

    return Math.min(100, rivalryScore);
  };

  const performShuffle = async () => {
    setIsShuffling(true);

    // Simulate shuffling animation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    const division1 = shuffledTeams.slice(0, 6);
    const division2 = shuffledTeams.slice(6, 12);

    const balanceScore1 = calculateDivisionBalance(division1);
    const balanceScore2 = calculateDivisionBalance(division2);
    const overallBalance = (balanceScore1 + balanceScore2) / 2;

    const rivalryScore1 = calculateRivalryScore(division1);
    const rivalryScore2 = calculateRivalryScore(division2);
    const overallRivalry = (rivalryScore1 + rivalryScore2) / 2;

    const strengths1 = division1.map(calculateTeamStrength);
    const strengths2 = division2.map(calculateTeamStrength);
    const avgStrength1 = strengths1.reduce((sum, str) => sum + str, 0) / 6;
    const avgStrength2 = strengths2.reduce((sum, str) => sum + str, 0) / 6;
    const strengthVariance = Math.abs(avgStrength1 - avgStrength2);

    const result: ShuffleResult = {
      division1,
      division2,
      balanceScore: Math.round(overallBalance),
      strengthVariance: Math.round(strengthVariance * 10) / 10,
      rivalryScore: Math.round(overallRivalry),
    };

    setShuffledDivisions(result);
    setShuffleHistory((prev) => [result, ...prev.slice(0, 4)]); // Keep last 5 shuffles
    setIsShuffling(false);
  };

  const resetToOriginal = () => {
    setShuffledDivisions(null);
    setShuffleHistory([]);
  };

  const saveBestShuffle = () => {
    if (shuffleHistory.length === 0) return;

    const bestShuffle = shuffleHistory.reduce((best, current) =>
      current.balanceScore + current.rivalryScore - current.strengthVariance >
      best.balanceScore + best.rivalryScore - best.strengthVariance
        ? current
        : best
    );

    setShuffledDivisions(bestShuffle);
  };

  const getQualityBadge = (score: number, type: "balance" | "rivalry") => {
    const thresholds =
      type === "balance"
        ? { excellent: 80, good: 60, fair: 40 }
        : { excellent: 60, good: 40, fair: 20 };

    if (score >= thresholds.excellent) {
      return (
        <Badge variant="default" className="bg-green-600">
          Excellent
        </Badge>
      );
    } else if (score >= thresholds.good) {
      return (
        <Badge variant="secondary" className="bg-blue-600">
          Good
        </Badge>
      );
    } else if (score >= thresholds.fair) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
          Fair
        </Badge>
      );
    } else {
      return <Badge variant="destructive">Poor</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle className="w-5 h-5" />
          Division Shuffler
        </CardTitle>
        <CardDescription>
          Generate new division arrangements and analyze their competitive
          balance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={performShuffle}
            disabled={isShuffling}
            className="flex-1 min-w-[150px]"
          >
            {isShuffling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Shuffling...
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4 mr-2" />
                Shuffle Divisions
              </>
            )}
          </Button>

          <Button
            onClick={resetToOriginal}
            variant="outline"
            disabled={isShuffling}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>

          {shuffleHistory.length > 0 && (
            <Button
              onClick={saveBestShuffle}
              variant="secondary"
              disabled={isShuffling}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Best
            </Button>
          )}
        </div>

        {/* Current/Shuffled Divisions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((divisionNum) => {
            const division = shuffledDivisions
              ? divisionNum === 1
                ? shuffledDivisions.division1
                : shuffledDivisions.division2
              : divisionNum === 1
              ? originalDivisions.division1
              : originalDivisions.division2;

            const divisionName =
              divisionNum === 1
                ? divisionNames.division1
                : divisionNames.division2;

            return (
              <Card
                key={divisionNum}
                className="border-2 border-dashed border-muted-foreground/30"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-4 h-4" />
                    {divisionName}
                    {shuffledDivisions && (
                      <Badge variant="outline" className="ml-auto">
                        Shuffled
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {division
                      .sort(
                        (a, b) =>
                          calculateTeamStrength(b) - calculateTeamStrength(a)
                      )
                      .map((team, index) => (
                        <div
                          key={team.roster.roster_id}
                          className="flex items-center justify-between p-2 rounded bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            >
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium text-sm">
                                {team.teamName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {team.ownerName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {team.wins}-{team.losses}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {team.pointsFor.toFixed(1)} PF
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Shuffle Analysis */}
        {shuffledDivisions && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5" />
                Shuffle Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-background">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Balance Score</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {shuffledDivisions.balanceScore}/100
                  </p>
                  <div className="mt-2">
                    {getQualityBadge(shuffledDivisions.balanceScore, "balance")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    How evenly matched teams are within divisions
                  </p>
                </div>

                <div className="text-center p-4 rounded-lg bg-background">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">Rivalry Potential</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {shuffledDivisions.rivalryScore}/100
                  </p>
                  <div className="mt-2">
                    {getQualityBadge(shuffledDivisions.rivalryScore, "rivalry")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Potential for exciting close matchups
                  </p>
                </div>

                <div className="text-center p-4 rounded-lg bg-background">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Division Parity</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {shuffledDivisions.strengthVariance.toFixed(1)}
                  </p>
                  <div className="mt-2">
                    <Badge
                      variant={
                        shuffledDivisions.strengthVariance < 5
                          ? "default"
                          : shuffledDivisions.strengthVariance < 10
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {shuffledDivisions.strengthVariance < 5
                        ? "Excellent"
                        : shuffledDivisions.strengthVariance < 10
                        ? "Good"
                        : "Poor"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Strength difference between divisions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shuffle History */}
        {shuffleHistory.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Recent Shuffles ({shuffleHistory.length}/5)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {shuffleHistory.slice(0, 5).map((shuffle, index) => (
                <div key={index} className="p-3 border rounded-lg bg-muted/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Shuffle #{index + 1}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Score:{" "}
                      {shuffle.balanceScore +
                        shuffle.rivalryScore -
                        shuffle.strengthVariance}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Balance:</span>
                      <span>{shuffle.balanceScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rivalry:</span>
                      <span>{shuffle.rivalryScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parity:</span>
                      <span>{shuffle.strengthVariance.toFixed(1)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-2"
                    onClick={() => setShuffledDivisions(shuffle)}
                  >
                    Use This Arrangement
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
