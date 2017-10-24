if (!require(pacman)) {
  install.packages("pacman")
  library(pacman)
}

pacman::p_load(magrittr, dplyr, tidyr, ggplot2, gdata, reshape2, forcats, parsedate)

queries <- read.csv("./database_profiling_2017-10-24T17:35:35.606Z.csv", sep = "@", header = F, stringsAsFactors = F)
colnames(queries) <- c("query", "time")

queries.grouped <- queries %>%
  group_by(query) %>%
  summarise(total=sum(time))  %>%
  arrange(desc(total))
  
write.csv(x = queries.grouped, file = "./grouped.csv", sep = "@")