FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY java-service/pom.xml java-service/pom.xml
RUN mvn -q -f java-service/pom.xml dependency:go-offline

COPY java-service java-service
RUN mvn -q -f java-service/pom.xml test package

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /workspace/java-service/target/java-service-1.0.0.jar /app/java-service.jar

EXPOSE 3005

ENTRYPOINT ["java", "-jar", "/app/java-service.jar"]
