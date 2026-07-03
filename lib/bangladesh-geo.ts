export interface Division {
  id: string
  name: string
  districts: string[]
}

export const BANGLADESH_GEOGRAPHY: Division[] = [
  {
    id: "barishal",
    name: "Barishal",
    districts: ["Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"]
  },
  {
    id: "chittagong",
    name: "Chittagong",
    districts: [
      "Bandarban",
      "Brahmanbaria",
      "Chandpur",
      "Chittagong",
      "Comilla",
      "Cox's Bazar",
      "Feni",
      "Khagrachhari",
      "Lakshmipur",
      "Noakhali",
      "Rangamati"
    ]
  },
  {
    id: "dhaka",
    name: "Dhaka",
    districts: [
      "Dhaka",
      "Faridpur",
      "Gazipur",
      "Gopalganj",
      "Kishoreganj",
      "Madaripur",
      "Manikganj",
      "Munshiganj",
      "Narsingdi",
      "Narayanganj",
      "Rajbari",
      "Shariatpur",
      "Tangail"
    ]
  },
  {
    id: "khulna",
    name: "Khulna",
    districts: [
      "Bagerhat",
      "Chuadanga",
      "Jessore",
      "Jhenaidah",
      "Khulna",
      "Kushtia",
      "Magura",
      "Meherpur",
      "Narail",
      "Satkhira"
    ]
  },
  {
    id: "mymensingh",
    name: "Mymensingh",
    districts: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"]
  },
  {
    id: "rajshahi",
    name: "Rajshahi",
    districts: [
      "Bogra",
      "Joypurhat",
      "Naogaon",
      "Natore",
      "Nawabganj",
      "Pabna",
      "Rajshahi",
      "Sirajganj"
    ]
  },
  {
    id: "rangpur",
    name: "Rangpur",
    districts: [
      "Dinajpur",
      "Gaibandha",
      "Kurigram",
      "Lalmonirhat",
      "Nilphamari",
      "Panchagarh",
      "Rangpur",
      "Thakurgaon"
    ]
  },
  {
    id: "sylhet",
    name: "Sylhet",
    districts: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"]
  }
]
