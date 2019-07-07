const sqlite = require("sqlite")
let db
const SQL = require('sql-template-strings')
const Command = require("discord.js-commando").Command
const Embed = require('discord.js').RichEmbed

module.exports = class CarCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'cars',
			group: 'util',
			memberName: 'cars',
			description: 'Advanced search for vehicle names used in photon addons.',
			args: [{
				key: 'path',
				label: 'Search Path',
				prompt: 'Enter the path to search.',
				type: 'string',
			}]
		})
	}

	async run(msg, args, _){
		let reply = msg.say(`Searching for \`${args.path.replace(/`/, '\`')}\` in addons.`)

		let matches = await db.all(SQL`SELECT cname as path, COUNT(*) as count FROM cars WHERE cname = ${args.path} GROUP BY cname`)

		matches.map(msg.say)
		matches = matches.filter(x => x.count > 0)
		if (matches.length === 0){return (await reply).edit("I haven't seen that car name before.")}

		msg.say("got to #1")
		matches = await Promise.all(
			matches.map(async x => {
				return {
					path: x.path,
					data: await db.all(SQL`SELECT cname as path, owner, name, CAST(sid AS TEXT) as sid, sname FROM cars INNER JOIN addons on cars.owner = addons.wsid INNER JOIN authors ON addons.author = authors.sid WHERE cname = ${x.path}`)
				}
			})
		)

		msg.say("got to #2")
		let embeds = matches.map(match => {
			let embed = new Embed()
			let i = 1
			embed.setAuthor(`Vehicle Report: ${x.path}`)
			match.data.map(addon =>
				embed.addField(
					`Addon ${i++}`,
					`[${addon.name.replace(/([\[\]])/g, '\$1')}](https://steamcommunity.com/sharedfiles/filedetails/?id=${addon.owner}) by [${addon.sname.replace(/([\[\]])/g, '\$1')}](https://steamcommunity.com/profiles/${addon.sid})`
				)
			)
			return embed
		})

		msg.say("got to #3")
		reply = await reply
		return Promise.all(matches.map(x => reply.say(x)))
	}
}

async function main(){db = await sqlite.open("/app/photon.read.db")}
main()