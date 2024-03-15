// import React, { useEffect, useRef, useState } from "react";
// import "./crontab-input.css";
// import { CronTime } from "cron";
// import cronstrue from 'cronstrue';
// import {formatDate} from "~/lib/utils";
// import {CronParser} from "cronstrue/dist/cronParser";
//
// const commonValueHint = [
//   ["*", "任何值"],
//   [",", "取值分隔符"],
//   ["-", "范围内的值"],
//   ["/", "步长"],
// ];
//
// const valueHints = [
//   [...commonValueHint, ["0-59", "可取的值"]],
//   [...commonValueHint, ["0-23", "可取的值"]],
//   [...commonValueHint, ["1-31", "可取的值"]],
//   [...commonValueHint, ["1-12", "可取的值"], ["JAN-DEC", "可取的值"]],
//   [...commonValueHint, ["0-6", "可取的值"], ["SUN-SAT", "可取的值"]],
// ];
// valueHints[-1] = [...commonValueHint];
//
// export default function CrontabInput({
//   value,
//   onChange,
// }: {
//   value: string;
//   onChange: (value: string) => void;
// }) {
//   const [parsed, setParsed] = useState({});
//   const [highlightedExplanation, setHighlightedExplanation] = useState("");
//   const [isValid, setIsValid] = useState(true);
//   const [selectedPartIndex, setSelectedPartIndex] = useState(-1);
//   const [nextSchedules, setNextSchedules] = useState<string[]>([]);
//   const [nextExpanded, setNextExpanded] = useState(false);
//
//   const inputRef = useRef<HTMLInputElement>(null);
//   const lastCaretPosition = useRef(-1);
//
//   useEffect(() => {
//     calculateNext();
//     calculateExplanation();
//   }, [value]);
//
//   const clearCaretPosition = () => {
//     lastCaretPosition.current = -1;
//     setSelectedPartIndex(-1);
//     setHighlightedExplanation(highlightParsed(-1));
//   };
//
//   const calculateNext = () => {
//     const nextSchedules = [];
//     try {
//       const cronInstance = new CronTime(value);
//       let timePointer = +new Date();
//       for (let i = 0; i < 5; i++) {
//         const next = cronInstance.getNextDateFrom(new Date(timePointer));
//         nextSchedules.push(formatDate(next.toJSDate()));
//         timePointer = +next + 1000;
//       }
//     } catch (e) {}
//
//     setNextSchedules(nextSchedules);
//   };
//
//   const highlightParsed = (selectedPartIndex: number) => {
//     let toHighlight = [];
//     let highlighted = "";
//
//     for (let i = 0; i < 5; i++) {
//       if (parsed.segments[i]?.text) {
//         toHighlight.push({ ...parsed.segments[i] });
//       } else {
//         toHighlight.push(null);
//       }
//     }
//
//     if (selectedPartIndex >= 0) {
//       if (toHighlight[selectedPartIndex]) {
//         toHighlight[selectedPartIndex].active = true;
//       }
//     }
//
//     if (
//       toHighlight[0] &&
//       toHighlight[1] &&
//       toHighlight[0].text &&
//       toHighlight[0].text === toHighlight[1].text &&
//       toHighlight[0].start === toHighlight[1].start
//     ) {
//       if (toHighlight[1].active) {
//         toHighlight[0] = null;
//       } else {
//         toHighlight[1] = null;
//       }
//     }
//
//     toHighlight = toHighlight.filter((_) => _);
//
//     toHighlight.sort((a, b) => {
//       return a.start - b.start;
//     });
//
//     let pointer = 0;
//     toHighlight.forEach((item) => {
//       if (pointer > item.start) {
//         return;
//       }
//       highlighted += parsed.description.substring(pointer, item.start);
//       pointer = item.start;
//       highlighted += `<span${
//         item.active ? ' class="active"' : ""
//       }>${parsed.description.substring(
//         pointer,
//         pointer + item.text.length,
//       )}</span>`;
//       pointer += item.text.length;
//     });
//
//     highlighted += parsed.description.substring(pointer);
//
//     return highlighted;
//   };
//
//   const calculateExplanation = () => {
//     let isValid = true;
//     let parsed;
//     let highlightedExplanation = "";
//     try {
//       parsed = new CronParser(value).parse();
//     } catch (e : unknown) {
//       highlightedExplanation = String(e);
//       isValid = false;
//     }
//
//     setParsed(parsed);
//     setHighlightedExplanation(highlightedExplanation);
//     setIsValid(isValid);
//
//     if (isValid) {
//       setHighlightedExplanation(highlightParsed(-1));
//     }
//   };
//
//   const onCaretPositionChange = () => {
//     if (!inputRef.current) {
//       return;
//     }
//     let caretPosition = inputRef.current.selectionStart;
//     const selected = value.substring(
//       inputRef.current.selectionStart ?? 0,
//       inputRef.current.selectionEnd ?? 0,
//     );
//     if (selected.indexOf(" ") >= 0) {
//       caretPosition = -1;
//     }
//     if (lastCaretPosition.current === caretPosition) {
//       return;
//     }
//     lastCaretPosition.current = caretPosition ?? -1;
//     if (caretPosition === -1) {
//       setHighlightedExplanation(highlightParsed(-1));
//       setSelectedPartIndex(-1);
//       return;
//     }
//     const textBeforeCaret = value.substring(0, caretPosition ?? 0);
//     const selectedPartIndex = textBeforeCaret.split(" ").length - 1;
//     setSelectedPartIndex(selectedPartIndex);
//     setHighlightedExplanation(highlightParsed(selectedPartIndex));
//   };
//
//   return (
//     <div className="crontab-input">
//       <div
//         className="explanation"
//         dangerouslySetInnerHTML={{
//           __html: isValid ? `“${highlightedExplanation}”` : "　",
//         }}
//       />
//
//       <div className="next">
//         {!!nextSchedules.length && (
//           <span>
//             下次: {nextSchedules[0]}{" "}
//             {nextExpanded ? (
//               <a onClick={() => setNextExpanded(false)}>(隐藏)</a>
//             ) : (
//               <a onClick={() => setNextExpanded(true)}>
//                 (更多)
//               </a>
//             )}
//             {nextExpanded && (
//               <div className="next-items">
//                 {nextSchedules.slice(1).map((item, index) => (
//                   <div className="next-item" key={index}>
//                     之后: {item}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </span>
//         )}
//       </div>
//
//       <input
//         type="text"
//         className={`cron-input ${!isValid ? "error" : ""}`}
//         value={value}
//         ref={inputRef}
//         onMouseUp={() => onCaretPositionChange()}
//         onKeyUp={() => onCaretPositionChange()}
//         onBlur={() => clearCaretPosition()}
//         onChange={(e) => {
//           const parts = e.target.value.split(" ").filter((_) => _);
//           if (parts.length !== 5) {
//             onChange(e.target.value);
//             setParsed({});
//             setIsValid(false);
//             return;
//           }
//
//           onChange(e.target.value);
//         }}
//       />
//
//       <div className="parts">
//         {[
//           "分",
//           "时",
//           "日",
//           "月",
//           "周",
//         ].map((unit, index) => (
//           <div
//             key={index}
//             className={`part ${selectedPartIndex === index ? "selected" : ""}`}
//           >
//             {unit}
//           </div>
//         ))}
//       </div>
//
//       {valueHints[selectedPartIndex] && (
//         <div className="allowed-values">
//           {valueHints[selectedPartIndex]?.map((value, index) => (
//             <div className="value" key={index}>
//               <div className="key">{value[0]}</div>
//               <div className="value">{value[1]}</div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
