// Cassandra database configuration

import cassandra from "cassandra-driver";
const client = new cassandra.Client({
  contactPoints: ["127.0.0.1"],
  localDataCenter: "datacenter1",
  keyspace: "chatapp",
});

export default client;
