if (!require(pacman)) {
  install.packages("pacman")
  library(pacman)
}

pacman::p_load(magrittr, dplyr, tidyr, ggplot2, gdata, reshape2, forcats, parsedate)

filename <- "database_profiling_2017-10-29T1_41_11.282Z.csv"

queries <- read.csv(paste("./", filename, sep=""), sep = "@", header = F, stringsAsFactors = F)
colnames(queries) <- c("query", "time")

queries.grouped <- queries %>%
  group_by(query) %>%
  summarise(total=sum(time), count=n(), average=mean(time))  %>%
  arrange(desc(total))
  
write.csv(x = queries.grouped, file = paste("./", "grouped_", filename), sep = "@")