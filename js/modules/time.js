export function getCurrentTime() {
  const now = new Date();
  const timeArray = [
    (((now.getFullYear() - 1901) % 73) + 73) % 73, // 0 to 72
    now.getMonth() + 1, // 1 to 12
    now.getDate(), // 1 to 31
    now.getHours(), // 0 to 23
    now.getMinutes(), // 0 to 59
    now.getSeconds(), // 0 to 59
  ];
  return timeArray;
}
