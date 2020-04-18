// Marks
// Request: GET /marks?symbol=<ticker_name>&from=<unix_timestamp>&to=<unix_timestamp>&resolution=<resolution>
//
// symbol: symbol name or ticker.
// from: unix timestamp (UTC) of leftmost visible bar
// to: unix timestamp (UTC) of rightmost visible bar
// resolution: string
// Response: Response is expected to be an object with some properties listed below. This object is similar to respective response in JS API, but each property is treated as table column, like described above.
//
// {
//     id: [array of ids],
//     time: [array of times],
//     color: [array of colors],
//     text: [array of texts],
//     label: [array of labels],
//     labelFontColor: [array of label font colors],
//     minSize: [array of minSizes],
// }
// Remark: This call will be requested if your datafeed sent supports_marks: true in configuration data.

export default async ctx => {
  ctx
}
