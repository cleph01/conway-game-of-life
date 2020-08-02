import React, { useState, useCallback, useRef } from "react";

import Slider from "react-input-slider";

import styled from "styled-components";

import produce from "immer";

import "./App.css";

import glider from "./images/glider.gif";
import pulsar from "./images/pulsar.gif";
import blinker from "./images/blinker.gif";
import random from "./images/random.gif";

const numRows = 25;
const numCols = 25;

// Midpoints of Grid
const verticalMid = Math.floor(numRows / 2);
const horizontalMid = Math.floor(numCols / 2);

// array of operations to be used in game algorithm
// (i.e.) nested loop to determine effect of Game rules
const operations = [
    [0, 1],
    [0, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, 0],
    [-1, 0],
];

// Coordinates for Blinker Preset
const BlinkerPresetValues = [
    [-1, 0],
    [0, 0],
    [1, 0],
];

// Coordinates for Glider Preset
const GliderPresetValues = [
    [0, 0],
    [-1, 0],
    [-2, 0],
    [-2, -1],
    [-1, -2],
];

// Coordinates for Pulsar Preset
const PulsarPresetValues = [
    // 1st cluster
    [-3, -2],
    [-2, -2],
    [-1, -2],
    [-5, 2],
    [-5, 1],
    [-5, 0],
    [0, 0],
    [0, 1],
    [0, 2],
    [-1, 3],
    [-2, 3],
    [-3, 3],
    // 2nd cluster
    [-3, 5],
    [-2, 5],
    [-1, 5],
    [-5, 8],
    [-5, 7],
    [-5, 6],
    [0, 6],
    [0, 7],
    [0, 8],
    [-1, 10],
    [-2, 10],
    [-3, 10],
    // 3rd cluster
    [2, 0],
    [2, 1],
    [2, 2],
    [7, 0],
    [7, 1],
    [7, 2],
    [3, -2],
    [4, -2],
    [5, -2],
    [5, 3],
    [4, 3],
    [3, 3],
    //4th cluster
    [2, 6],
    [2, 7],
    [2, 8],
    [7, 6],
    [7, 7],
    [7, 8],
    [3, 5],
    [4, 5],
    [5, 5],
    [3, 10],
    [4, 10],
    [5, 10],
];

// Helper function for Clear Button
const generateEmptyGrid = () => {
    const rows = [];
    // Use a for loop to populate the rows array
    for (let i = 0; i < numRows; i++) {
        // Going to push a column in to the row array
        // The Column is also an array of 0s and 1s (0=dead, 1=alive)
        // Defaults to 0s to start with
        // To initialize an Array with only 0s
        rows.push(Array.from(Array(numCols), () => 0));
    }
    return rows;
};

// START Components
const MainContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const SectionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
`;

const GridContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid black;
    padding: 18px;
`;

const GridHeader = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    width: 100%;
`;

const PresetsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 25px;
`;

const RulesWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px dashed black;
    padding: 0px 16px;
`;

const OptionsWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 25px;
    width: 100%;
`;

const OptionsButton = styled.button`
    border-radius: 5px;
    padding: 4px;
    width: 120px;
    font-size: 12px;
    margin-bottom: 5px;
`;

const SpeedWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 25px;
`;

const RuleLine = styled.li`
    margin-bottom: 15px;
`;

const ImagePresetWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #000;
    margin-bottom: 5px;
`;

const Image = styled.img`
    width: 90px;
    height: auto;
    margin-bottom: 10px;
`;

// END Components

function App() {
    // Holds Generation Speed State
    const [speed, setSpeed] = useState(200);
    // Temp Speed
    const [tempSpeed, setTempSpeed] = useState(speed);

    // Initialize setGrid using a function so it only runs once
    const [grid, setGrid] = useState(() => {
        return generateEmptyGrid();
    });

    // Holds state indicating whether logic is running
    const [running, setRunning] = useState(false);

    // Using useRef because runSimulation is using a useCallback hook
    // in order to prevent re-calling the function on every React re-render
    // so because runSimulation is wanting access to 'running' we need to useRef
    // to give runSimulation correct up-to-date state
    const runningRef = useRef();
    const speedRef = useRef();

    runningRef.current = running;
    speedRef.current = speed;

    // Hold Generation Counter state
    const [generation, setGeneration] = useState(0);

    const runSimulation = useCallback(() => {
        if (!runningRef.current) {
            return;
        }
        // passing function to setGrid, parameter is current value of grid
        // returns new value for our grid by way of produce function passing in g
        // and gridCopy which will be mutated instead of original grid as done
        // when setting original up.
        // i.e. any mutation done to gridCopy with set the state of the grid
        setGrid((g) => {
            return produce(g, (gridCopy) => {
                // using 2 for loops
                for (let i = 0; i < numRows; i++) {
                    for (let k = 0; k < numCols; k++) {
                        let neighbors = 0;
                        // the if statement ought to be done for each of the
                        // 8 coordinates around a focus cell in order to
                        // determine live/dead rules of the game
                        // but we will use a trick to avoid so many
                        // if statements (duplicate logic) i.e. Keep it DRY

                        // if (gridCopy[i][k + 1] === 1) {
                        //     neighbors += 1;
                        // }
                        operations.forEach(([x, y]) => {
                            const newI = i + x;
                            const newK = k + y;

                            if (
                                newI >= 0 &&
                                newI < numRows &&
                                newK >= 0 &&
                                newK < numCols
                            ) {
                                neighbors += g[newI][newK];
                            }
                        });

                        //Rules 1 & 3
                        // 1. Any live cell with fewer than two live neighbours dies,
                        // as if by underpopulation.
                        // 3. Any live cell with more than three live neighbours dies,
                        // as if by overpopulation.
                        if (neighbors < 2 || neighbors > 3) {
                            gridCopy[i][k] = 0;
                        } else if (g[i][k] === 0 && neighbors === 3) {
                            gridCopy[i][k] = 1;
                        }
                    }
                }
            });
        });

        setGeneration((gen) => gen + 1);

        setTimeout(runSimulation, speedRef.current);
    }, []);

    // Preset Blinker
    const generateBlinkerPreset = () => {
        setGrid((g) => {
            return produce(g, (gridCopy) => {
                // Use a for loop to populate the rows array
                for (let i = 0; i < numRows; i++) {
                    for (let k = 0; k < numCols; k++) {
                        BlinkerPresetValues.forEach(([x, y]) => {
                            if (i === verticalMid && k === horizontalMid) {
                                gridCopy[i + x][k + y] = 1;
                            }
                        });
                    }
                }
            });
        });
    };

    // Preset Glider
    const generateGliderPreset = () => {
        setGrid((g) => {
            return produce(g, (gridCopy) => {
                // Use a for loop to populate the rows array
                for (let i = 0; i < numRows; i++) {
                    for (let k = 0; k < numCols; k++) {
                        GliderPresetValues.forEach(([x, y]) => {
                            if (i === verticalMid && k === horizontalMid) {
                                gridCopy[i + x][k + y] = 1;
                            }
                        });
                    }
                }
            });
        });
    };

    // Preset Pulsar
    const generatePulsarPreset = () => {
        setGrid((g) => {
            return produce(g, (gridCopy) => {
                // Use a for loop to populate the rows array
                for (let i = 0; i < numRows; i++) {
                    for (let k = 0; k < numCols; k++) {
                        PulsarPresetValues.forEach(([x, y]) => {
                            if (i === verticalMid && k === horizontalMid) {
                                gridCopy[i + x][k + y] = 1;
                            }
                        });
                    }
                }
            });
        });
    };

    return (
        <>
            <MainContainer>
                <div>
                    <h3>Conway's Game of Life</h3>
                </div>
                <SectionsContainer>
                    <GridContainer>
                        <GridHeader>
                            <div>Generation: {generation}</div>
                        </GridHeader>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: `repeat(${numCols}, 20px)`,
                            }}
                        >
                            {grid.map((rows, iR) =>
                                rows.map((col, iC) => (
                                    <div
                                        key={`${iR}-${iC}`}
                                        onClick={() => {
                                            if (!running) {
                                                // The immer library helps make an immutable
                                                // change to the gridCopy and return a newGrid
                                                // vs changing the grid directly
                                                const newGrid = produce(
                                                    grid,
                                                    (gridCopy) => {
                                                        gridCopy[iR][iC] = grid[
                                                            iR
                                                        ][iC]
                                                            ? 0
                                                            : 1;
                                                    }
                                                );

                                                setGrid(newGrid);
                                            }
                                        }}
                                        style={{
                                            width: 20,
                                            height: 20,
                                            backgroundColor: grid[iR][iC]
                                                ? "#46aadc"
                                                : undefined,
                                            border: "solid 1px black",
                                        }}
                                    />
                                ))
                            )}
                        </div>
                        <OptionsWrapper>
                            <OptionsButton
                                onClick={() => {
                                    setRunning(!running);
                                    if (!running) {
                                        // setting runningRef here alleviates
                                        // if setRunning(!running) doesn't update state in time
                                        runningRef.current = true;
                                        runSimulation();
                                    }
                                }}
                            >
                                {running ? "Stop" : "Start"}
                            </OptionsButton>
                            <SpeedWrapper>
                                <div
                                    style={{
                                        textAlign: "center",
                                        marginBottom: "10px",
                                    }}
                                >
                                    Current Speed <br /> is Every {speed / 1000}{" "}
                                    second(s)
                                </div>
                                <input
                                    type="number"
                                    placeholder={speed}
                                    onChange={(event) => {
                                        setTempSpeed(event.target.value);
                                        console.log("TempSpeed ", tempSpeed);
                                    }}
                                    style={{ marginBottom: "10px" }}
                                />
                                <OptionsButton
                                    onClick={() => {
                                        setSpeed(tempSpeed);
                                        console.log(speed);
                                    }}
                                >
                                    Set Speed
                                </OptionsButton>
                            </SpeedWrapper>
                            <OptionsButton
                                onClick={() => {
                                    setGrid(generateEmptyGrid());
                                    setGeneration(0);
                                }}
                            >
                                Clear
                            </OptionsButton>
                        </OptionsWrapper>
                        <RulesWrapper>
                            <p>Rules</p>
                            <span style={{ fontWeight: "bold" }}>
                                Click on any cell while simulation is stopped,
                                or use presets below. Then press START.
                            </span>
                            <ul style={{ marginLeft: "50px" }}>
                                <RuleLine>
                                    Any live cell with two or three live
                                    neighbours survives.
                                </RuleLine>
                                <RuleLine>
                                    Any dead cell with three live neighbours
                                    becomes a live cell.
                                </RuleLine>
                                <RuleLine>
                                    All other live cells die in the next
                                    generation. Similarly, all other dead cells
                                    stay dead.
                                </RuleLine>
                            </ul>
                        </RulesWrapper>
                    </GridContainer>
                    <PresetsWrapper>
                        <p>Presets</p>
                        <ImagePresetWrapper>
                            <Image src={blinker} alt="blinker" />
                            <OptionsButton
                                onClick={() => {
                                    generateBlinkerPreset();
                                }}
                            >
                                Blinker
                            </OptionsButton>
                        </ImagePresetWrapper>
                        <ImagePresetWrapper>
                            <Image src={glider} alt="glider" />
                            <OptionsButton
                                onClick={() => {
                                    generateGliderPreset();
                                }}
                            >
                                Glider
                            </OptionsButton>
                        </ImagePresetWrapper>
                        <ImagePresetWrapper>
                            <Image src={pulsar} alt="pulsar" />
                            <OptionsButton
                                onClick={() => {
                                    generatePulsarPreset();
                                }}
                            >
                                Pulsar
                            </OptionsButton>
                        </ImagePresetWrapper>
                        <ImagePresetWrapper>
                            <Image src={random} alt="random" />
                            <OptionsButton
                                onClick={() => {
                                    const rows = [];
                                    // Use a for loop to populate the rows array
                                    for (let i = 0; i < numRows; i++) {
                                        // Going to push a column in to the row array
                                        // The Column is also an array of 0s and 1s (0=dead, 1=alive)
                                        // Defaults to 0s to start with
                                        // To initialize an Array with only 0s
                                        rows.push(
                                            Array.from(Array(numCols), () =>
                                                Math.random() > 0.7 ? 1 : 0
                                            )
                                        );
                                    }

                                    setGrid(rows);
                                }}
                            >
                                Random
                            </OptionsButton>
                        </ImagePresetWrapper>
                    </PresetsWrapper>
                </SectionsContainer>
            </MainContainer>
        </>
    );
}

export default App;
