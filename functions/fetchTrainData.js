const fetchTrainData = async (TrainLocation) => {
    try {
      const trainData = await TrainLocation.find()
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();
      
      console.log(`Fetched ${trainData.length} train locations`);
      return trainData;
    } catch (error) {
      console.error("Error fetching train data:", error);
      throw error;
    }
  };
  
  module.exports = fetchTrainData;