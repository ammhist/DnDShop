"use client";
import React, { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';

export default function Home() {
  const axiosConfig = axios.create({
    baseURL: 'http://localhost:8000',
  });
  type Shop = {
    shopName : string
    shopDescription : string
    ownerName : string
    ownerLooks : string
  }

  const [data, setData] = useState<string[] | null>(null);
  const [description, setDescription] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);


  const fetchShop = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const tags = [] as string[];
      for (let i = 1; i < 9; i++) {
        if (((event.target as HTMLFormElement).elements[i] as HTMLInputElement).checked) {
          tags.push(((event.target as HTMLFormElement).elements[i] as HTMLInputElement).value)
        }
      }

      const response = await axiosConfig.post('/shop', {
        size: ((event.target as HTMLFormElement).elements[0] as HTMLInputElement).value,
        tags: tags,
        quality: ((event.target as HTMLFormElement).elements[9] as HTMLInputElement).value,
        details: ((event.target as HTMLFormElement).elements[10] as HTMLInputElement).value,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setData(response.data.items);
      //convert description from string to json
      const rawDescription = response.data.description;
      //remove all the \n and + from the string
      rawDescription.replace(/\n/g, '');
      rawDescription.replace(/\+/g, '');
      console.log(rawDescription);

      //convert the string to json
      const jsonObject = JSON.parse(rawDescription);
      setDescription(jsonObject);

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again.");
    }
  };

  useEffect(() => {
    console.log("description: ", description);
  }, [description]);



  return (
    <main className={styles.main}>
      <div>
        <h1>Shop Generator</h1>
        <form onSubmit={fetchShop}>
          <label>
            <p>Amount</p>
            <input name="Size" id="Size" type='number' />
          </label>
          <p>Type</p>
          <div className={styles.checkbox}>
            <div>
              <p>Gear</p>
              <input id="Gear" type="checkbox" value="Gear" />
            </div>
            <div>

              <p>Armor</p>
              <input id="Armor" type="checkbox" value="Armor" />
            </div>

            <div>

              <p>Weapons</p>
              <input id="Weapon" type="checkbox" value="Weapon" />
            </div>

            <div>

              <p>Tools</p>
              <input id="Tools" type="checkbox" value="Tools" />
            </div>

            <div>

              <p>Gaming Sets</p>
              <input id="Gaming Set" type="checkbox" value="Gaming Set" />
            </div>

            <div>

              <p>Insturment</p>
              <input id="Insturment" type="checkbox" value="Insturment" />
            </div>

            <div>

              <p>Potion</p>
              <input id="Potion" type="checkbox" value="Potion" />
            </div>

            <div>

              <p>Scrolls</p>
              <input id="Scrolls" type="checkbox" value="Scrolls" />
            </div>

          </div>
          <label>
            <p>Magic Quality</p>
            <select name="Quality" id="Quality">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label>
            <p>Wanted Details</p>
            <input name="Details" id="Details" type='text' />
          </label>
          <input type="submit" value="Submit" />
        </form>
        {error && <p className={styles.error}>{error}</p>}
        {description && 
        <div>
          <h1>{description.shopName}</h1>
          <p>{description.shopDescription}</p>
          <h2>{description.ownerName}</h2>
          <p>{description.ownerLooks}</p>

        </div>

        }
        <h2>Items</h2>
        {data
          ? data.map((item, index) => (
            <div key={index}>
              <p>{item[0] + " " + item[1] + " " + item[2] + " " + item[3]}</p>
            </div>
          ))
          : null
        }

      </div>
    </main>
  );
}