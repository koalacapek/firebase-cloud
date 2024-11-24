/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin"
import * as logger from "firebase-functions/logger";

admin.initializeApp()

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

export const getFriends = onRequest(async (request, response) => {
  const snapshots = await admin.firestore().collection('cities').get()
  const cities = snapshots.docs.map((city) => ({
    id: city.id,
    ...city.data()
  }))

  response.send(cities)
})

export const addCity = onRequest(async (req, res) => {
  const { cityName, friends } = req.body
  const detail = {
    friends: friends
  }

  try {
    await admin.firestore().collection('cities').doc(cityName).set(detail)
  } catch (error) {
    console.error(error)
  }

  res.status(200).send({ message: "City successfully added!" })
})

interface ICity {
  friends: string[]
  neighbour: string
}

export const getNeighbourDetail = onRequest(async (req, res) => {
  const cityName = req.query.city
  if (!cityName) {
    res.status(400).send({ error: "Missing 'city' query parameter" });
    return;
  }
  try {
    // Fetch the city document from Firestore
    const snapshot = await admin.firestore().collection('cities').doc(cityName as string).get();

    if (!snapshot.exists) {
      res.status(404).send({ error: `City '${cityName}' not found` });
      return;
    }

    const data = snapshot.data();
    if (!data) {
      res.status(404).send({ error: `City '${cityName}' has no data` });
      return;
    }

    // Get city data
    const neighbour = data as ICity

    // Respond with city data
    res.status(200).send(neighbour.neighbour);
  } catch (error) {
    console.error("Error fetching city details:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
})

export const addFriend = onRequest(async (req, res) => {
  const cityName = req.query.city
  const { newFriend } = req.body

  if (!cityName) {
    res.status(404).send({ error: 'City is not defined' })
  }

  // get the ref
  try {

    const chosenRef = admin.firestore().collection('cities').doc(cityName as string)
    const snapshot = await chosenRef.get()
    // get the friends array
    const detail = snapshot.data() as ICity
    const friends = [...detail.friends, newFriend]

    // Now update the firestore
    const final = {
      friends: friends,
      neighbour: detail.neighbour
    }
    await chosenRef.set(final)
    res.status(200).send({ message: 'New friend successfully added!' })
  } catch (error) {
    console.error(error)
  }
})

export const removeFriend = onRequest(async (req, res) => {
  const cityName = req.query.city
  const { newFriend } = req.body

  if (!cityName) {
    res.status(404).send({ error: 'City is not defined' })
  }

  // get the ref
  try {

    const chosenRef = admin.firestore().collection('cities').doc(cityName as string)
    const snapshot = await chosenRef.get()
    // get the friends array
    const detail = snapshot.data() as ICity
    const friends = detail.friends.filter((friend) => friend !== newFriend)

    // Now update the firestore
    const final = {
      friends: friends,
      neighbour: detail.neighbour
    }
    await chosenRef.set(final)
    res.status(200).send({ message: 'Friend successfully removed!' })
  } catch (error) {
    console.error(error)
  }
})

export const deleteCity = onRequest(async (req, res) => {
  const { chosenCity } = req.body

  const cityRef = admin.firestore().collection('cities').doc(chosenCity)

  try {
    // remove city
    await cityRef.delete()
    res.status(200).send({ message: 'City successfully deleted' })
  } catch (error) {
    res.status(404).send({ message: 'City to be deleted is not found' })
  }
})