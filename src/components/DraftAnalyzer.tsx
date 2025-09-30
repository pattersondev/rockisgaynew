"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamData } from "@/types/sleeper";
import {
  Trophy,
  TrendingDown,
  Calendar,
  Target,
  Star,
  AlertTriangle,
  Award,
  Zap,
} from "lucide-react";

interface DraftPick {
  player_id: string;
  name: string;
  position: string;
  team: string;
  round: number;
  pick: number;
  season: string;
  fantasy_points: number;
  expected_points: number;
  value_score: number;
  status: string;
  roster_id: number;
}

interface TeamDraftAnalysis {
  teamName: string;
  ownerName: string;
  season: string;
  bestPick: DraftPick;
  worstPick: DraftPick;
  overallGrade: string;
  stealCount: number;
  bustCount: number;
  averageValue: number;
}

export default function DraftAnalyzer({ teams }: { teams: TeamData[] }) {
  const [draftData, setDraftData] = useState<TeamDraftAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>("ALL");
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [availableSeasons, setAvailableSeasons] = useState<string[]>(["ALL"]);

  useEffect(() => {
    const fetchDraftData = async () => {
      try {
        const LEAGUE_ID = "1180953029979762688";

        // Fetch draft data from Sleeper API
        const draftResponse = await fetch(
          `https://api.sleeper.app/v1/league/${LEAGUE_ID}/drafts`
        );
        const drafts = await draftResponse.json();

        if (!drafts || drafts.length === 0) {
          console.log("No draft data found for this league");
          setDraftData([]);
          setLoading(false);
          return;
        }

        // Get the most recent draft
        const latestDraft = drafts[drafts.length - 1];
        const draftId = latestDraft.draft_id;
        const draftOrder = latestDraft.draft_order; // This contains user_id -> draft_slot mapping

        // Fetch draft picks
        const picksResponse = await fetch(
          `https://api.sleeper.app/v1/draft/${draftId}/picks`
        );
        const picks = await picksResponse.json();

        // Fetch player data for all drafted players
        const playerIds = [
          ...new Set(picks.map((pick: any) => pick.player_id)),
        ];
        const playersResponse = await fetch(
          "https://api.sleeper.app/v1/players/nfl"
        );
        const allPlayers = await playersResponse.json();

        // Fetch league matchups to get actual fantasy points for players
        const currentSeason = latestDraft.season;
        const playerFantasyPoints: { [key: string]: number } = {};

        // Get league matchups to calculate actual fantasy points
        // We'll try to get multiple weeks of data for a more complete picture
        try {
          const weeksToFetch = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
          ]; // Regular season weeks

          for (const week of weeksToFetch) {
            try {
              const matchupsResponse = await fetch(
                `https://api.sleeper.app/v1/league/${LEAGUE_ID}/matchups/${week}`
              );
              const matchups = await matchupsResponse.json();

              // Process matchups to get player points
              if (matchups && matchups.length > 0) {
                // Debug: Log first matchup structure for week
                if (week === 1) {
                  console.log("Week 1 matchup sample:", matchups[0]);
                }

                matchups.forEach((matchup: any) => {
                  // Use players_points as it contains all players (starters + bench)
                  if (matchup.players_points) {
                    Object.entries(matchup.players_points).forEach(
                      ([playerId, points]: [string, any]) => {
                        if (
                          playerId &&
                          playerId !== "0" &&
                          typeof points === "number"
                        ) {
                          playerFantasyPoints[playerId] =
                            (playerFantasyPoints[playerId] || 0) + points;
                        }
                      }
                    );
                  }
                });
              }
            } catch (weekError) {
              // If a week doesn't exist yet, that's fine, continue to next week
              console.log(`Week ${week} not available yet`);
              break; // Stop trying more weeks if we hit an error
            }
          }
        } catch (error) {
          console.log("Could not fetch matchup data, using estimated points");
        }

        // Debug: Log some sample fantasy points data
        console.log(
          "Sample fantasy points data:",
          Object.entries(playerFantasyPoints).slice(0, 5)
        );
        console.log(
          "Total players with fantasy points:",
          Object.keys(playerFantasyPoints).length
        );

        // Debug: Show some specific player totals
        const samplePlayers = Object.entries(playerFantasyPoints)
          .filter(([_, points]) => points > 20)
          .slice(0, 5);
        console.log("Players with 20+ points:", samplePlayers);

        // If we didn't get much data, try an alternative approach
        if (Object.keys(playerFantasyPoints).length < 10) {
          console.log(
            "Limited matchup data found, trying alternative approach..."
          );

          // Try to get player stats directly for some key players
          const keyPlayerIds = picks
            .slice(0, 20)
            .map((pick: any) => pick.player_id);

          for (const playerId of keyPlayerIds) {
            try {
              // Try to get current season stats for this player
              const statsResponse = await fetch(
                `https://api.sleeper.app/v1/players/nfl/stats/2024/${playerId}`
              );
              const statsData = await statsResponse.json();

              if (statsData && statsData.stats) {
                const player = allPlayers[playerId];
                if (player) {
                  const fantasyPoints = calculateFantasyPoints(
                    statsData.stats,
                    player.position
                  );
                  playerFantasyPoints[playerId] = fantasyPoints;
                  console.log(
                    `Got stats for ${player.full_name}: ${fantasyPoints} points`
                  );
                }
              }
            } catch (error) {
              console.log(`Could not get stats for player ${playerId}`);
            }
          }
        }

        // Process picks into our format
        const processedPicks: DraftPick[] = picks
          .map((pick: any) => {
            const player = allPlayers[pick.player_id];
            if (!player) {
              console.log("Player not found for ID:", pick.player_id);
              return null;
            }

            // Calculate expected points based on draft position
            const expectedPoints = calculateExpectedPoints(
              pick.pick_no,
              player.position
            );

            // Get actual fantasy points from league matchups
            const fantasyPoints = playerFantasyPoints[pick.player_id] || 0;

            // Debug: Log specific player data
            if (pick.pick_no <= 5) {
              console.log(
                `Player: ${player.full_name} (${player.position}), Pick: ${pick.pick_no}, Fantasy Points: ${fantasyPoints}, Expected: ${expectedPoints}`
              );
            }

            return {
              player_id: pick.player_id,
              name: player.full_name,
              position: player.position,
              team: player.team || "FA",
              round: pick.round,
              pick: pick.pick_no,
              season: latestDraft.season,
              fantasy_points: fantasyPoints,
              expected_points: expectedPoints,
              value_score: fantasyPoints / expectedPoints,
              status: player.status || "Active",
              roster_id: pick.roster_id,
            };
          })
          .filter(Boolean);

        // Process draft data into team analysis
        const processedData = processDraftData(
          processedPicks,
          teams,
          draftOrder
        );
        setDraftData(processedData);

        // Update available seasons
        const seasons = [...new Set(processedData.map((data) => data.season))]
          .sort()
          .reverse();
        setAvailableSeasons(["ALL", ...seasons]);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching draft data:", error);
        setLoading(false);
      }
    };

    fetchDraftData();
  }, [teams]);

  const calculateExpectedPoints = (
    pickNumber: number,
    position: string
  ): number => {
    // More realistic expected points based on draft position and position scarcity
    // These reflect what you actually expect from each draft position in fantasy football

    // Base expectations for each position (what you'd expect from a late-round pick)
    const positionBasePoints = {
      QB: 150, // Lower expectations for QBs
      RB: 100, // Lower expectations for RBs
      WR: 85, // Lower expectations for WRs
      TE: 60, // Lower expectations for TEs
      K: 50, // Lower expectations for kickers
      DEF: 60, // Lower expectations for defenses
    };

    const basePoints =
      positionBasePoints[position as keyof typeof positionBasePoints] || 90;

    // Much more conservative draft position expectations
    let positionMultiplier;

    if (pickNumber <= 12) {
      // Round 1 - Elite expectations but more realistic
      positionMultiplier = 1.4 + (12 - pickNumber) * 0.02; // 1.4 to 1.6
    } else if (pickNumber <= 24) {
      // Round 2 - High expectations
      positionMultiplier = 1.2 + (24 - pickNumber) * 0.015; // 1.2 to 1.4
    } else if (pickNumber <= 36) {
      // Round 3 - Solid starter expectations
      positionMultiplier = 1.0 + (36 - pickNumber) * 0.01; // 1.0 to 1.2
    } else if (pickNumber <= 48) {
      // Round 4 - Good starter expectations
      positionMultiplier = 0.9 + (48 - pickNumber) * 0.008; // 0.9 to 1.0
    } else if (pickNumber <= 60) {
      // Round 5 - Flex starter expectations
      positionMultiplier = 0.8 + (60 - pickNumber) * 0.005; // 0.8 to 0.9
    } else if (pickNumber <= 72) {
      // Round 6 - Bench/flex expectations
      positionMultiplier = 0.7 + (72 - pickNumber) * 0.005; // 0.7 to 0.8
    } else if (pickNumber <= 84) {
      // Round 7 - Deep bench expectations
      positionMultiplier = 0.6 + (84 - pickNumber) * 0.005; // 0.6 to 0.7
    } else if (pickNumber <= 96) {
      // Round 8 - Very deep bench expectations
      positionMultiplier = 0.5 + (96 - pickNumber) * 0.005; // 0.5 to 0.6
    } else if (pickNumber <= 120) {
      // Rounds 9-10 - Streamer/lottery expectations
      positionMultiplier = 0.4 + (120 - pickNumber) * 0.005; // 0.4 to 0.5
    } else {
      // Rounds 11+ - Pure lottery tickets
      positionMultiplier = 0.3 + Math.max(0, (150 - pickNumber) * 0.003);
    }

    return Math.round(basePoints * positionMultiplier);
  };

  const calculateBestPickScore = (pick: DraftPick): number => {
    // Base value score
    let score = pick.value_score;

    // Position importance multiplier (skill positions get priority)
    const positionMultiplier = {
      QB: 1.0, // Quarterbacks are important
      RB: 1.2, // Running backs are most important
      WR: 1.2, // Wide receivers are most important
      TE: 0.8, // Tight ends are less important
      K: 0.3, // Kickers are least important
      DEF: 0.4, // Defenses are less important
    };

    // Draft position bonus (earlier picks get priority)
    let draftPositionBonus = 1.0;
    if (pick.pick <= 12) {
      // Round 1 picks get significant bonus
      draftPositionBonus = 1.5;
    } else if (pick.pick <= 24) {
      // Round 2 picks get good bonus
      draftPositionBonus = 1.3;
    } else if (pick.pick <= 36) {
      // Round 3 picks get moderate bonus
      draftPositionBonus = 1.1;
    } else if (pick.pick <= 48) {
      // Round 4 picks get small bonus
      draftPositionBonus = 1.0;
    } else if (pick.pick <= 72) {
      // Rounds 5-6 picks get neutral treatment
      draftPositionBonus = 0.9;
    } else {
      // Late round picks get penalty (unless they're amazing steals)
      draftPositionBonus = pick.value_score > 1.5 ? 1.0 : 0.7;
    }

    const positionWeight =
      positionMultiplier[pick.position as keyof typeof positionMultiplier] ||
      1.0;

    return score * positionWeight * draftPositionBonus;
  };

  const calculateWorstPickScore = (pick: DraftPick): number => {
    // Base value score (lower is worse)
    let score = pick.value_score;

    // Position importance penalty (early picks that bust are worse)
    const positionPenalty = {
      QB: 1.0, // QB busts are bad
      RB: 1.2, // RB busts are very bad (high draft capital)
      WR: 1.2, // WR busts are very bad (high draft capital)
      TE: 0.8, // TE busts are less bad
      K: 0.4, // Kicker busts are expected (low draft capital)
      DEF: 0.5, // Defense busts are less bad
    };

    // Draft position penalty (earlier picks that bust are much worse)
    let draftPositionPenalty = 1.0;
    if (pick.pick <= 12) {
      // Round 1 busts are terrible
      draftPositionPenalty = 2.0;
    } else if (pick.pick <= 24) {
      // Round 2 busts are very bad
      draftPositionPenalty = 1.7;
    } else if (pick.pick <= 36) {
      // Round 3 busts are bad
      draftPositionPenalty = 1.4;
    } else if (pick.pick <= 48) {
      // Round 4 busts are moderate
      draftPositionPenalty = 1.1;
    } else if (pick.pick <= 72) {
      // Rounds 5-6 busts are less bad
      draftPositionPenalty = 0.9;
    } else {
      // Late round busts are expected (unless they're really terrible)
      draftPositionPenalty = pick.value_score < 0.3 ? 1.0 : 0.6;
    }

    const positionWeight =
      positionPenalty[pick.position as keyof typeof positionPenalty] || 1.0;

    // Lower score is worse, so we want to find the lowest score
    // But we weight it so early picks that bust are penalized more
    return score / (positionWeight * draftPositionPenalty);
  };

  const calculateFantasyPoints = (stats: any, position: string): number => {
    if (!stats) return 0;

    let points = 0;

    switch (position) {
      case "QB":
        // Standard QB scoring: 4pt pass TD, 1pt per 25 pass yards, 6pt rush TD, 1pt per 10 rush yards
        const passYards = (stats.pass_yds || 0) / 25;
        const passTDs = (stats.pass_td || 0) * 4;
        const rushYards = (stats.rush_yds || 0) / 10;
        const rushTDs = (stats.rush_td || 0) * 6;
        const interceptions = (stats.int || 0) * -2;
        points = passYards + passTDs + rushYards + rushTDs + interceptions;
        break;

      case "RB":
        // Standard RB scoring: 6pt rush TD, 1pt per 10 rush yards, 1pt per 10 rec yards, 6pt rec TD
        const rbRushYards = (stats.rush_yds || 0) / 10;
        const rbRushTDs = (stats.rush_td || 0) * 6;
        const rbRecYards = (stats.rec_yds || 0) / 10;
        const rbRecTDs = (stats.rec_td || 0) * 6;
        const rbReceptions = (stats.rec || 0) * 1; // PPR
        points = rbRushYards + rbRushTDs + rbRecYards + rbRecTDs + rbReceptions;
        break;

      case "WR":
        // Standard WR scoring: 6pt rec TD, 1pt per 10 rec yards, 1pt per reception
        const wrRecYards = (stats.rec_yds || 0) / 10;
        const wrRecTDs = (stats.rec_td || 0) * 6;
        const wrReceptions = (stats.rec || 0) * 1; // PPR
        const wrRushYards = (stats.rush_yds || 0) / 10;
        const wrRushTDs = (stats.rush_td || 0) * 6;
        points = wrRecYards + wrRecTDs + wrReceptions + wrRushYards + wrRushTDs;
        break;

      case "TE":
        // Standard TE scoring: 6pt rec TD, 1pt per 10 rec yards, 1pt per reception
        const teRecYards = (stats.rec_yds || 0) / 10;
        const teRecTDs = (stats.rec_td || 0) * 6;
        const teReceptions = (stats.rec || 0) * 1; // PPR
        points = teRecYards + teRecTDs + teReceptions;
        break;

      case "K":
        // Standard K scoring: 3pt FG, 1pt XP, -1pt missed FG
        const fgMade = (stats.fgm || 0) * 3;
        const xpMade = (stats.xpm || 0) * 1;
        const fgMissed = (stats.fga || 0) - (stats.fgm || 0);
        points = fgMade + xpMade - fgMissed;
        break;

      case "DEF":
        // Standard DEF scoring: points allowed, sacks, interceptions, fumbles, TDs
        const pointsAllowed = stats.pa || 0;
        let paPoints = 0;
        if (pointsAllowed === 0) paPoints = 10;
        else if (pointsAllowed <= 6) paPoints = 7;
        else if (pointsAllowed <= 13) paPoints = 4;
        else if (pointsAllowed <= 20) paPoints = 1;
        else if (pointsAllowed <= 27) paPoints = 0;
        else if (pointsAllowed <= 34) paPoints = -1;
        else paPoints = -4;

        const sacks = (stats.sack || 0) * 1;
        const defInterceptions = (stats.int || 0) * 2;
        const fumbles = (stats.fr || 0) * 2;
        const defTDs = (stats.td || 0) * 6;
        const safety = (stats.safety || 0) * 2;

        points =
          paPoints + sacks + defInterceptions + fumbles + defTDs + safety;
        break;

      default:
        points = 0;
    }

    return Math.round(points * 100) / 100; // Round to 2 decimal places
  };

  const processDraftData = (
    picks: DraftPick[],
    teams: TeamData[],
    draftOrder: { [key: string]: number }
  ): TeamDraftAnalysis[] => {
    // Group picks by team and season
    const teamSeasons: { [key: string]: DraftPick[] } = {};

    picks.forEach((pick) => {
      // Use the roster_id from the pick to determine which team made the pick
      // The roster_id corresponds to the team's roster in the league
      const rosterId = pick.roster_id;

      // Find the team that matches this roster_id
      const team = teams.find((t) => t.roster.roster_id === rosterId);
      if (!team) {
        console.log(
          "Team not found for roster_id:",
          rosterId,
          "Available teams:",
          teams.map((t) => ({
            name: t.teamName,
            roster_id: t.roster.roster_id,
          }))
        );
        return; // Skip if team not found
      }

      const key = `team_${team.roster.roster_id}_${pick.season}`;

      if (!teamSeasons[key]) {
        teamSeasons[key] = [];
      }
      teamSeasons[key].push(pick);
    });

    // Create analysis for each team/season combination
    const analysis: TeamDraftAnalysis[] = [];

    Object.entries(teamSeasons).forEach(([key, teamPicks]) => {
      if (teamPicks.length > 0) {
        const season = teamPicks[0].season;
        const rosterId = parseInt(key.split("_")[1]);
        const team = teams.find((t) => t.roster.roster_id === rosterId);

        if (!team) return; // Skip if team not found

        // Find best and worst picks
        const bestPick = teamPicks.reduce((best, current) => {
          // Prioritize earlier picks and skill positions for "best pick"
          const currentScore = calculateBestPickScore(current);
          const bestScore = calculateBestPickScore(best);
          return currentScore > bestScore ? current : best;
        });

        const worstPick = teamPicks.reduce((worst, current) => {
          // For worst pick, prioritize early picks that underperformed
          const currentScore = calculateWorstPickScore(current);
          const worstScore = calculateWorstPickScore(worst);
          return currentScore < worstScore ? current : worst;
        });

        // Calculate additional metrics with early-season adjusted thresholds
        const stealCount = teamPicks.filter(
          (pick) => pick.value_score > 1.5 // Only truly exceptional picks are steals
        ).length;
        const bustCount = teamPicks.filter(
          (pick) => pick.value_score < 0.4 // Much more lenient for early season (was 0.6)
        ).length;
        const averageValue =
          teamPicks.reduce((sum, pick) => sum + pick.value_score, 0) /
          teamPicks.length;

        // Calculate overall grade
        const overallGrade = calculateDraftGrade(
          averageValue,
          stealCount,
          bustCount
        );

        analysis.push({
          teamName: team.teamName,
          ownerName: team.ownerName,
          season,
          bestPick,
          worstPick,
          overallGrade,
          stealCount,
          bustCount,
          averageValue,
        });
      }
    });

    return analysis;
  };

  const calculateDraftGrade = (
    averageValue: number,
    stealCount: number,
    bustCount: number
  ): string => {
    let score = 0;

    // Average value score (0-3 points) - more granular
    if (averageValue >= 1.3) score += 3;
    else if (averageValue >= 1.1) score += 2.5;
    else if (averageValue >= 1.0) score += 2;
    else if (averageValue >= 0.9) score += 1.5;
    else if (averageValue >= 0.8) score += 1;

    // Steal bonus (0-2 points) - only for truly exceptional steals
    if (stealCount >= 2) score += 2;
    else if (stealCount >= 1) score += 1;

    // Bust penalty (0-1.5 points deducted) - much more lenient for early season
    if (bustCount >= 4) score -= 1.5;
    else if (bustCount >= 3) score -= 1.0;
    else if (bustCount >= 2) score -= 0.5;
    else if (bustCount >= 1) score -= 0.25;

    // Convert to letter grade
    if (score >= 3.5) return "A+";
    if (score >= 3) return "A";
    if (score >= 2.5) return "A-";
    if (score >= 2) return "B+";
    if (score >= 1.5) return "B";
    if (score >= 1) return "B-";
    if (score >= 0.5) return "C+";
    if (score >= 0) return "C";
    return "D";
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600 bg-green-100";
    if (grade.startsWith("B")) return "text-blue-600 bg-blue-100";
    if (grade.startsWith("C")) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getValueColor = (value: number) => {
    if (value >= 1.5) return "text-green-600";
    if (value >= 1.2) return "text-blue-600";
    if (value >= 1.0) return "text-yellow-600";
    if (value >= 0.8) return "text-orange-600";
    return "text-red-600";
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "QB":
        return "bg-blue-500";
      case "RB":
        return "bg-green-500";
      case "WR":
        return "bg-purple-500";
      case "TE":
        return "bg-orange-500";
      case "K":
        return "bg-yellow-500";
      case "DEF":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredData = draftData.filter((data) => {
    const seasonMatch =
      selectedSeason === "ALL" || data.season === selectedSeason;
    const teamMatch = selectedTeam === "ALL" || data.teamName === selectedTeam;
    return seasonMatch && teamMatch;
  });

  const teamNames = ["ALL", ...teams.map((team) => team.teamName)];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Draft Pick Analyzer
          </CardTitle>
          <CardDescription>
            Analyzing draft picks and identifying steals and busts...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading draft data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Draft Pick Analyzer
        </CardTitle>
        <CardDescription>
          Analyze each team's best and worst draft picks based on draft position
          and performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Early season warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Early Season Analysis</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            With only 4 weeks of data, these results should be taken with a
            grain of salt. Player performance can vary significantly throughout
            the season.
          </p>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Season:</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-3 py-1 border rounded-md bg-background"
            >
              {availableSeasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Team:</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-1 border rounded-md bg-background"
            >
              {teamNames.map((teamName) => (
                <option key={teamName} value={teamName}>
                  {teamName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Draft Analysis */}
        <div className="space-y-6">
          {filteredData
            .sort((a, b) => b.averageValue - a.averageValue)
            .map((analysis, index) => (
              <div
                key={`${analysis.teamName}-${analysis.season}`}
                className="border rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-sm">
                      #{index + 1}
                    </Badge>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {analysis.teamName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {analysis.ownerName} • {analysis.season} Season
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      className={`${getGradeColor(
                        analysis.overallGrade
                      )} font-bold`}
                    >
                      Grade: {analysis.overallGrade}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {analysis.stealCount} Steals • {analysis.bustCount}{" "}
                        Busts
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Avg Value: {analysis.averageValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Best Pick */}
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-green-800 dark:text-green-200">
                        Best Pick
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge
                          className={`${getPositionColor(
                            analysis.bestPick.position
                          )} text-white`}
                        >
                          {analysis.bestPick.position}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {analysis.bestPick.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {analysis.bestPick.team} • Round{" "}
                            {analysis.bestPick.round}, Pick{" "}
                            {analysis.bestPick.pick}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <p>
                            Points:{" "}
                            {analysis.bestPick.fantasy_points.toFixed(1)}
                          </p>
                          <p>
                            Expected:{" "}
                            {analysis.bestPick.expected_points.toFixed(1)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${getValueColor(
                              analysis.bestPick.value_score
                            )}`}
                          >
                            {analysis.bestPick.value_score.toFixed(2)}x
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Value Score
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Worst Pick */}
                  <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h4 className="font-medium text-red-800 dark:text-red-200">
                        Worst Pick
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge
                          className={`${getPositionColor(
                            analysis.worstPick.position
                          )} text-white`}
                        >
                          {analysis.worstPick.position}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {analysis.worstPick.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {analysis.worstPick.team} • Round{" "}
                            {analysis.worstPick.round}, Pick{" "}
                            {analysis.worstPick.pick}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <p>
                            Points:{" "}
                            {analysis.worstPick.fantasy_points.toFixed(1)}
                          </p>
                          <p>
                            Expected:{" "}
                            {analysis.worstPick.expected_points.toFixed(1)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${getValueColor(
                              analysis.worstPick.value_score
                            )}`}
                          >
                            {analysis.worstPick.value_score.toFixed(2)}x
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Value Score
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No draft data found for the selected criteria
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
